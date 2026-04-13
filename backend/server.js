require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'libra_secret_key_12345';
const MONGODB_URI = process.env.MONGODB_URI;
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API);

// --- MongoDB Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas & Models ---

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Hashed for librarian, empty for google student login
    name: { type: String, required: true },
    role: { type: String, enum: ['student', 'librarian'], default: 'student' },
    photoURL: { type: String },
    pendingFines: { type: Number, default: 0 },
    readingGoal: { type: Number, default: 12 } // books per year
});
const User = mongoose.model('User', userSchema);

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    coverClass: { type: String, default: 'placeholder-cover-1' },
    totalCopies: { type: Number, default: 1 },
    available: { type: Number, default: 1 }
});
const Book = mongoose.model('Book', bookSchema);

const borrowSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    bookTitle: { type: String, required: true },
    bookAuthor: { type: String, required: true },
    userEmail: { type: String, required: true },
    studentName: { type: String, required: true },
    borrowDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returned: { type: Boolean, default: false },
    returnDate: { type: Date },
    issuedBy: { type: String, default: 'Self' }
});
const Borrow = mongoose.model('Borrow', borrowSchema);

const paymentLogSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['online_card', 'online_upi', 'online_netbanking', 'cash'], default: 'online_card' },
    status: { type: String, enum: ['success', 'pending'], default: 'success' },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
});
const PaymentLog = mongoose.model('PaymentLog', paymentLogSchema);

const wishlistSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    addedAt: { type: Date, default: Date.now }
});
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// --- Initialization Seed (Run once to create admin and sample books if DB is empty) ---
async function seedDatabase() {
    try {
        const adminCount = await User.countDocuments({ role: 'librarian' });
        if (adminCount === 0) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            await new User({
                email: 'admin@library.com',
                password: hashedPassword,
                name: 'Head Librarian',
                role: 'librarian'
            }).save();
            console.log('Default librarian account created: admin@library.com / password123');
        }

        const bookCount = await Book.countDocuments();
        if (bookCount === 0) {
            await Book.insertMany([
                { title: "The Midnight Library", author: "Matt Haig", coverClass: "placeholder-cover-1", totalCopies: 5, available: 5 },
                { title: "Dune", author: "Frank Herbert", coverClass: "rec-2", totalCopies: 3, available: 3 },
                { title: "Project Hail Mary", author: "Andy Weir", coverClass: "rec-1", totalCopies: 4, available: 4 },
                { title: "Atomic Habits", author: "James Clear", coverClass: "rec-3", totalCopies: 6, available: 6 },
                { title: "1984", author: "George Orwell", coverClass: "placeholder-cover-2", totalCopies: 2, available: 2 }
            ]);
            console.log('Sample books seeded to database.');
        }
    } catch (e) {
        console.error('Error seeding database:', e);
    }
}
seedDatabase();

// --- Auth Middleware ---
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) return res.status(403).json({ success: false, message: "Token missing." });
    const token = bearerHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: "Invalid or expired token." });
        req.user = decoded; // { email, role, name }
        next();
    });
};

const verifyLibrarian = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== 'librarian') {
            return res.status(403).json({ success: false, message: "Librarian access required." });
        }
        next();
    });
};

// --- API ROUTES ---

// 1. Librarian Login (Email/Password)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.role !== 'librarian') {
            return res.status(200).json({ success: false, message: "Invalid librarian credentials." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(200).json({ success: false, message: "Invalid librarian credentials." });
        }

        const token = jwt.sign({ email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ success: true, token, user: { name: user.name, email: user.email, role: user.role, id: user._id } });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error during login." });
    }
});

// 2. Student Auth Sync (Firebase Google Login)
app.post('/api/auth/sync', async (req, res) => {
    const { email, name, photoURL } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ email, name, photoURL, role: 'student' });
            await user.save();
        } else {
            // Update photo if changed
            if (photoURL && user.photoURL !== photoURL) {
                user.photoURL = photoURL;
                await user.save();
            }
        }
        const token = jwt.sign({ email: user.email, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '8h' });
        res.json({ success: true, token, user: { name: user.name, email: user.email, role: user.role, id: user._id, photoURL } });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error during sync." });
    }
});

// 3. Get Student Dashboard Data
app.get('/api/student/dashboard', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const activeLoans = await Borrow.find({ userEmail: req.user.email, returned: false }).populate('bookId');

        const borrows = activeLoans.map(b => {
            const today = new Date();
            const due = new Date(b.dueDate);
            const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            return {
                txId: b._id.toString(),
                bookId: b.bookId._id,
                title: b.bookTitle,
                author: b.bookAuthor,
                coverClass: b.bookId.coverClass || 'placeholder-cover-1',
                dueDate: b.dueDate,
                daysLeft: daysLeft,
                overdue: daysLeft < 0
            };
        });

        const booksRead = await Borrow.countDocuments({ userEmail: req.user.email, returned: true });

        res.json({
            success: true,
            user: { name: user.name, email: user.email },
            pendingFines: user.pendingFines || 0,
            booksRead,
            fines: user.pendingFines || 0,
            borrows
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 4. Get Available Books Catalog
app.get('/api/books', verifyToken, async (req, res) => {
    try {
        const allBooks = await Book.find();
        // Standardize output to match previous array structure format (using .id instead of ._id)
        const formatBooks = allBooks.map(b => ({
            id: b._id.toString(),
            title: b.title,
            author: b.author,
            coverClass: b.coverClass,
            totalCopies: b.totalCopies,
            available: b.available
        }));
        res.json({ success: true, books: formatBooks });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 5. Borrow a Book (Disabled — only librarians can issue books)
app.post('/api/books/borrow', verifyToken, async (req, res) => {
    return res.status(403).json({ success: false, message: "Self-borrowing is disabled. Please visit the library counter and ask the librarian to issue the book for you." });
});

// 5a. Get Student Reading Goal & Progress
app.get('/api/student/reading-goal', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const currentYear = new Date().getFullYear();
        const yearStart = new Date(`${currentYear}-01-01T00:00:00.000Z`);

        // Count books returned this calendar year (= books actually read/completed)
        const booksReadThisYear = await Borrow.countDocuments({
            userEmail: req.user.email,
            returned: true,
            returnDate: { $gte: yearStart }
        });

        // Also count active borrows borrowed this year towards progress
        const activeBorrowsThisYear = await Borrow.countDocuments({
            userEmail: req.user.email,
            returned: false,
            borrowDate: { $gte: yearStart }
        });

        res.json({
            success: true,
            goal: user.readingGoal || 12,
            booksRead: booksReadThisYear,
            booksActive: activeBorrowsThisYear,
            year: currentYear
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// 5b. Update Student Reading Goal
app.put('/api/student/reading-goal', verifyToken, async (req, res) => {
    const { goal } = req.body;
    const parsed = parseInt(goal);
    if (!parsed || parsed < 1 || parsed > 500) {
        return res.status(400).json({ success: false, message: 'Goal must be between 1 and 500.' });
    }
    try {
        await User.updateOne({ email: req.user.email }, { readingGoal: parsed });
        res.json({ success: true, message: `Reading goal updated to ${parsed} books.`, goal: parsed });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});


// --- Librarian Routes ---

// 6. Get Admin Stats
app.get('/api/stats', verifyLibrarian, async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student' });
        const booksIssued = await Borrow.countDocuments({ returned: false });

        const totalBooksResult = await Book.aggregate([{ $group: { _id: null, total: { $sum: "$totalCopies" } } }]);
        const totalBooks = totalBooksResult.length > 0 ? totalBooksResult[0].total : 0;

        const finesResult = await User.aggregate([{ $group: { _id: null, totalFines: { $sum: "$pendingFines" } } }]);
        const totalFinesPending = finesResult.length > 0 ? finesResult[0].totalFines : 0;

        res.json({
            success: true,
            stats: { totalBooks, booksIssued, totalUsers: studentCount, totalFinesPending }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 7. Get All Active Borrows (Librarian)
app.get('/api/borrows', verifyLibrarian, async (req, res) => {
    try {
        const activeLoans = await Borrow.find({ returned: false }).sort({ borrowDate: -1 });

        const formatBorrows = activeLoans.map(b => {
            const today = new Date();
            const due = new Date(b.dueDate);
            const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            return {
                txId: b._id.toString(),
                bookId: b.bookId,
                bookTitle: b.bookTitle,
                bookAuthor: b.bookAuthor,
                studentName: b.studentName,
                studentEmail: b.userEmail,
                borrowDate: b.borrowDate.toISOString(),
                dueDate: b.dueDate.toISOString(),
                daysLeft,
                overdue: daysLeft < 0,
                issuedBy: b.issuedBy
            };
        });
        res.json({ success: true, borrows: formatBorrows });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 8. Issue a Book to a Student (Librarian)
app.post('/api/books/issue', verifyLibrarian, async (req, res) => {
    const { bookId, studentEmail } = req.body;
    if (!bookId || !studentEmail) return res.status(400).json({ success: false, message: "Book and Student Email are required." });

    try {
        const student = await User.findOne({ email: studentEmail });
        if (!student) return res.status(404).json({ success: false, message: "Student account not found." });
        if (student.role === 'librarian') return res.status(400).json({ success: false, message: "Cannot issue books to a librarian." });

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ success: false, message: "Book not found." });
        if (book.available <= 0) return res.status(400).json({ success: false, message: "No copies available to issue." });

        const alreadyBorrowed = await Borrow.findOne({ bookId, userEmail: studentEmail, returned: false });
        if (alreadyBorrowed) return res.status(400).json({ success: false, message: "Student already has this book on loan." });

        book.available -= 1;
        await book.save();

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const newBorrow = new Borrow({
            bookId: book._id,
            bookTitle: book.title,
            bookAuthor: book.author,
            userEmail: student.email,
            studentName: student.name,
            dueDate,
            issuedBy: req.user.email
        });
        await newBorrow.save();

        res.json({ success: true, message: `"${book.title}" successfully issued to ${student.name}.` });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 9. Return a Book (Librarian)
app.post('/api/books/return', verifyLibrarian, async (req, res) => {
    const { txId } = req.body;
    if (!txId) return res.status(400).json({ success: false, message: "Transaction ID (txId) is required." });

    try {
        const borrow = await Borrow.findOne({ _id: txId, returned: false });
        if (!borrow) return res.status(404).json({ success: false, message: "Active borrow not found." });

        borrow.returned = true;
        borrow.returnDate = new Date();
        await borrow.save();

        // --- Auto-Fine Calculation ---
        const dueDate = new Date(borrow.dueDate);
        const returnDate = new Date(borrow.returnDate);
        if (returnDate > dueDate) {
            const diffTime = Math.abs(returnDate - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const fineAmount = diffDays * 1; // ₹1 per day

            const user = await User.findOne({ email: borrow.userEmail });
            if (user) {
                user.pendingFines = (user.pendingFines || 0) + fineAmount;
                await user.save();
                console.log(`Fine of ₹${fineAmount} added to ${user.email} (Overdue by ${diffDays} days)`);
            }
        }

        await Book.findByIdAndUpdate(borrow.bookId, { $inc: { available: 1 } });

        res.json({ success: true, message: `"${borrow.bookTitle}" returned successfully by ${borrow.userEmail}.` });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 10a. Student's Own Borrow History (Student)
app.get('/api/student/history', verifyToken, async (req, res) => {
    try {
        const borrows = await Borrow.find({ userEmail: req.user.email }).sort({ borrowDate: -1 });
        const history = borrows.map(b => ({
            txId: b._id.toString(),
            bookTitle: b.bookTitle,
            bookAuthor: b.bookAuthor,
            borrowDate: b.borrowDate.toISOString(),
            dueDate: b.dueDate.toISOString(),
            returned: b.returned,
            returnDate: b.returnDate ? b.returnDate.toISOString() : null,
            issuedBy: b.issuedBy
        }));
        res.json({ success: true, history });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// 10. Full Transaction History (Librarian)
app.get('/api/history', verifyLibrarian, async (req, res) => {
    try {
        const history = await Borrow.find().sort({ borrowDate: -1 });
        const formatHistory = history.map(b => ({
            txId: b._id.toString(),
            bookTitle: b.bookTitle,
            bookAuthor: b.bookAuthor,
            studentName: b.studentName,
            studentEmail: b.userEmail,
            borrowDate: b.borrowDate.toISOString(),
            dueDate: b.dueDate.toISOString(),
            returned: b.returned,
            returnDate: b.returnDate ? b.returnDate.toISOString() : null,
            issuedBy: b.issuedBy
        }));
        res.json({ success: true, history: formatHistory });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 11. Add a New Book
app.post('/api/books/add', verifyLibrarian, async (req, res) => {
    const { title, author, totalCopies } = req.body;
    if (!title || !author) return res.status(400).json({ success: false, message: "Title and author required." });

    try {
        const copies = parseInt(totalCopies) || 1;
        const newBook = new Book({
            title, author, totalCopies: copies, available: copies
        });
        await newBook.save();
        res.json({ success: true, message: `Successfully added "${title}" (${copies} copies).`, book: { id: newBook._id.toString() } });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 12. Edit a Book
app.put('/api/books/:id', verifyLibrarian, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ success: false, message: "Book not found." });

        const { title, author, totalCopies } = req.body;
        const currentlyIssued = book.totalCopies - book.available;

        if (title) book.title = title;
        if (author) book.author = author;
        if (totalCopies !== undefined) {
            const newTotal = parseInt(totalCopies);
            if (newTotal < currentlyIssued) {
                return res.status(400).json({ success: false, message: `Cannot reduce below ${currentlyIssued} (currently issued).` });
            }
            book.available = newTotal - currentlyIssued;
            book.totalCopies = newTotal;
        }

        await book.save();
        res.json({ success: true, message: `"${book.title}" updated successfully.` });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 13. Delete a Book
app.delete('/api/books/:id', verifyLibrarian, async (req, res) => {
    try {
        const issuedCount = await Borrow.countDocuments({ bookId: req.params.id, returned: false });
        if (issuedCount > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete — ${issuedCount} copies currently issued.` });
        }

        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ success: false, message: "Book not found." });

        res.json({ success: true, message: `"${book.title}" deleted.` });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 14. Collect Fine (Librarian Cash Collection)
app.post('/api/fines/collect', verifyLibrarian, async (req, res) => {
    const { email, studentEmail, amount } = req.body;
    const targetEmail = email || studentEmail;
    try {
        const user = await User.findOne({ email: targetEmail });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        const collectedAmount = parseFloat(amount) || 0;
        user.pendingFines = Math.max(0, (user.pendingFines || 0) - collectedAmount);
        await user.save();

        // Record cash payment in log
        await new PaymentLog({
            userEmail: user.email,
            amount: collectedAmount,
            method: 'cash',
            note: 'Cleared by librarian at counter'
        }).save();

        res.json({ success: true, message: `Successfully collected $${collectedAmount.toFixed(2)}.` });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 17. Get Student Fines & Payment History
app.get('/api/student/fines', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        // Build fine items: overdue borrows that still have not been returned
        const overdueBorrows = await Borrow.find({ userEmail: req.user.email, returned: false });
        const fineItems = overdueBorrows
            .filter(b => new Date(b.dueDate) < new Date())
            .map(b => {
                const daysOverdue = Math.ceil((new Date() - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
                const amount = daysOverdue * 1; // ₹1 per day
                return {
                    bookTitle: b.bookTitle,
                    bookAuthor: b.bookAuthor,
                    dueDate: b.dueDate,
                    daysOverdue,
                    amount
                };
            });

        // Payment history
        const payments = await PaymentLog.find({ userEmail: req.user.email }).sort({ createdAt: -1 }).limit(20);

        res.json({
            success: true,
            pendingFines: user.pendingFines || 0,
            fineItems,
            payments: payments.map(p => ({
                amount: p.amount,
                method: p.method,
                note: p.note,
                date: p.createdAt
            }))
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// 18. Student Online Payment
app.post('/api/student/fines/pay-online', verifyToken, async (req, res) => {
    const { amount, method } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount.' });
    const validMethods = ['online_card', 'online_upi', 'online_netbanking'];
    if (!validMethods.includes(method)) return res.status(400).json({ success: false, message: 'Invalid payment method.' });

    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const payAmount = parseFloat(amount);
        user.pendingFines = Math.max(0, (user.pendingFines || 0) - payAmount);
        await user.save();

        await new PaymentLog({
            userEmail: user.email,
            amount: payAmount,
            method,
            note: 'Online payment by student'
        }).save();

        res.json({ success: true, message: `Payment of ₹${payAmount.toFixed(2)} successful!`, newBalance: user.pendingFines });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// 15. List All Users
app.get('/api/users', verifyLibrarian, async (req, res) => {
    try {
        const allUsers = await User.find();

        // Fetch borrow stats for each user (Requires aggregation or mapped queries)
        const formatUsers = await Promise.all(allUsers.map(async u => {
            const activeLoans = await Borrow.countDocuments({ userEmail: u.email, returned: false });
            const totalBorrowed = await Borrow.countDocuments({ userEmail: u.email });

            return {
                id: u._id.toString(),
                name: u.name,
                email: u.email,
                role: u.role,
                pendingFines: u.pendingFines || 0,
                activeLoans,
                totalBorrowed,
                photoURL: u.photoURL || null
            };
        }));

        res.json({ success: true, users: formatUsers });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 16. Delete a User
app.delete('/api/users/:id', verifyLibrarian, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        if (user.role === 'librarian') {
            return res.status(403).json({ success: false, message: "Cannot delete a librarian account." });
        }

        const activeLoans = await Borrow.countDocuments({ userEmail: user.email, returned: false });
        if (activeLoans > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete — ${user.name} has ${activeLoans} active loan(s). Collect returns first.` });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: `User "${user.name}" removed.` });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// 19. Get Student Wishlist
app.get('/api/student/wishlist', verifyToken, async (req, res) => {
    try {
        const items = await Wishlist.find({ userEmail: req.user.email }).populate('bookId');
        const wishlist = items.filter(item => item.bookId).map(item => ({
            id: item.bookId._id,
            wishlistEntryId: item._id,
            title: item.bookId.title,
            author: item.bookId.author,
            available: item.bookId.available,
            coverClass: item.bookId.coverClass
        }));
        res.json({ success: true, wishlist });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// 20. Add to Wishlist
app.post('/api/student/wishlist/add', verifyToken, async (req, res) => {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ success: false, message: 'Book ID required.' });
    try {
        const exists = await Wishlist.findOne({ userEmail: req.user.email, bookId });
        if (exists) return res.status(400).json({ success: false, message: 'Book already in wishlist.' });

        const newItem = new Wishlist({ userEmail: req.user.email, bookId });
        await newItem.save();
        res.json({ success: true, message: 'Added to wishlist.' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// 21. Remove from Wishlist
app.delete('/api/student/wishlist/:bookId', verifyToken, async (req, res) => {
    try {
        await Wishlist.deleteOne({ userEmail: req.user.email, bookId: req.params.bookId });
        res.json({ success: true, message: 'Removed from wishlist.' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// 22. Search Books (Public/Student)
app.get('/api/books/search', verifyToken, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ success: true, books: [] });
    try {
        const books = await Book.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { author: { $regex: q, $options: 'i' } }
            ]
        });
        const formatBooks = books.map(b => ({
            id: b._id.toString(),
            title: b.title,
            author: b.author,
            coverClass: b.coverClass,
            totalCopies: b.totalCopies,
            available: b.available
        }));
        res.json({ success: true, books: formatBooks });
    } catch (e) {
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// --- AI Assistance Routes ---

// Shared helper: retry Gemini calls up to `maxRetries` times with exponential back-off.
// Tries gemini-2.5-flash first, then falls back to gemini-2.0-flash if it keeps failing.
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

async function geminiGenerate(prompt, maxRetries = 3) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const modelName of GEMINI_MODELS) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                console.log(`[AI] OK via ${modelName} (attempt ${attempt})`);
                return text;
            } catch (e) {
                const status = e.status;
                const retryable = status === 503 || status === 429 || !status; // 503 overloaded, 429 rate limit, no status = network error
                const notFound = status === 404;

                if (notFound) {
                    // This model name is wrong for this key — skip to next model
                    console.warn(`[AI] ${modelName} not supported, trying next model...`);
                    break;
                }

                if (retryable && attempt < maxRetries) {
                    const waitMs = attempt * 2000;
                    console.warn(`[AI] ${modelName} attempt ${attempt} failed (${status || 'network'}), retrying in ${waitMs}ms...`);
                    await delay(waitMs);
                } else {
                    console.error(`[AI] ${modelName} failed after ${attempt} attempts:`, e.message);
                    break;
                }
            }
        }
    }
    throw new Error('All Gemini models failed after retries.');
}

// 22. Get AI Book Description
app.get('/api/books/:bookId/ai-description', verifyToken, async (req, res) => {
    try {
        const { bookId } = req.params;
        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ success: false, message: "Book not found." });

        const prompt = `Provide a concise, engaging 2-3 sentence summary/description of the book "${book.title}" by "${book.author}" for a library catalog. Focus on the premise and why someone should read it.`;
        const text = await geminiGenerate(prompt);

        res.json({ success: true, description: text });
    } catch (e) {
        console.error("Book AI Error:", e.message);
        res.status(500).json({ success: false, message: "AI service is temporarily unavailable. Please try again in a moment." });
    }
});

// 23. Get AI Student Insights (Admin)
app.get('/api/admin/student-summary/:email', verifyLibrarian, async (req, res) => {
    try {
        const { email } = req.params;
        const student = await User.findOne({ email });
        if (!student) return res.status(404).json({ success: false, message: "Student not found." });

        const borrows = await Borrow.find({ userEmail: email }).sort({ borrowDate: -1 });

        let activeCount = 0;
        let pastCount = 0;
        let booksList = borrows.map(b => {
            if (b.returned) pastCount++; else activeCount++;
            const fine = !b.returned ? '' : '';
            return `"${b.bookTitle}" by ${b.bookAuthor} (${b.returned ? 'Returned' : 'Currently borrowed'})`;
        }).join('; ');

        const prompt = `You are a professional library assistant AI. Analyze the following student data and write a concise 3-4 sentence professional summary for a librarian.
Student Name: ${student.name}
Email: ${student.email}
Pending Fines: ₹${(student.pendingFines || 0).toFixed(2)}
Annual Reading Goal: ${student.readingGoal || 12} books/year
Currently Borrowed: ${activeCount} book(s)
Books Returned: ${pastCount} book(s)
Full Book Record: ${booksList || 'No books borrowed yet.'}
Summarise their reading activity, engagement level, and reliability. Keep tone professional and constructive. Output a single paragraph only.`;

        const text = await geminiGenerate(prompt);
        res.json({ success: true, summary: text });
    } catch (e) {
        console.error("Student AI Error:", e.message);
        res.status(500).json({ success: false, message: "AI service is temporarily unavailable. Please try again in a moment." });
    }
});

app.listen(PORT, () => {
    console.log(`Librarian Backend Server running on http://localhost:${PORT}`);
});
