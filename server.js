require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'libra_secret_key_12345';
const MONGODB_URI = process.env.MONGODB_URI;

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
                id: b._id,
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
        const pendingFines = finesResult.length > 0 ? finesResult[0].totalFines : 0;

        res.json({
            success: true,
            stats: { totalBooks, booksIssued, totalUsers: studentCount, pendingFines }
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
    const { email, amount } = req.body;
    try {
        const user = await User.findOne({ email });
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

// Start the server
app.listen(PORT, () => {
    console.log(`Librarian Backend Server running on http://localhost:${PORT}`);
});
