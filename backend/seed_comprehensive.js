const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// --- Schemas ---
const userSchema = new mongoose.Schema({ email: String, name: String, role: String, pendingFines: Number, readingGoal: Number });
const bookSchema = new mongoose.Schema({ title: String, author: String, available: Number, totalCopies: Number, coverClass: String });
const borrowSchema = new mongoose.Schema({
    bookId: mongoose.Schema.Types.ObjectId,
    bookTitle: String,
    bookAuthor: String,
    userEmail: String,
    studentName: String,
    borrowDate: { type: Date, default: Date.now },
    dueDate: Date,
    returned: { type: Boolean, default: false },
    returnDate: Date,
    issuedBy: String
});
const paymentLogSchema = new mongoose.Schema({
    userEmail: String, amount: Number, method: String, note: String, createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Book = mongoose.model('Book', bookSchema);
const Borrow = mongoose.model('Borrow', borrowSchema);
const PaymentLog = mongoose.model('PaymentLog', paymentLogSchema);

async function seedRealData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        // 1. Clean existing TEST data (optional, but better for consistency if we want a fresh state)
        // For safety, let's just add to it unless the user wants a wipe.
        // User hasn't asked for a wipe, so we add.

        const students = await User.find({ role: 'student' });
        const books = await Book.find({});

        if (students.length < 1 || books.length < 5) {
            console.log('Not enough students or books found. Please ensure users and books exist first.');
            process.exit(1);
        }

        const now = new Date();

        // Helper to get date N days from now
        const offsetDate = (days) => {
            const d = new Date();
            d.setDate(d.getDate() + days);
            return d;
        };

        const scenerios = [
            { 
                name: 'Overdue (Very Old)', 
                borrowDays: -30, dueDays: -16, returned: false, 
                desc: '16 days overdue' 
            },
            { 
                name: 'Overdue (Recent)', 
                borrowDays: -20, dueDays: -6, returned: false, 
                desc: '6 days overdue' 
            },
            { 
                name: 'Due Today/Soon', 
                borrowDays: -13, dueDays: 1, returned: false, 
                desc: 'Due tomorrow' 
            },
            { 
                name: 'Freshly Borrowed', 
                borrowDays: -1, dueDays: 13, returned: false, 
                desc: 'Borrowed yesterday' 
            },
            { 
                name: 'Returned (Success)', 
                borrowDays: -25, dueDays: -11, returned: true, returnDays: -12, 
                desc: 'Returned 1 day before due (History)' 
            },
            { 
                name: 'Returned (Late)', 
                borrowDays: -25, dueDays: -11, returned: true, returnDays: -5, 
                desc: 'Returned 6 days late (Added to balance previously)' 
            }
        ];

        let sIdx = 0;
        for (const student of students) {
            console.log(`Processing student: ${student.email}`);
            
            // Give 2-3 combinations per student
            for (let i = 0; i < 3; i++) {
                const sc = scenerios[sIdx % scenerios.length];
                const book = books[Math.floor(Math.random() * books.length)];

                const newBorrow = new Borrow({
                    bookId: book._id,
                    bookTitle: book.title,
                    bookAuthor: book.author,
                    userEmail: student.email,
                    studentName: student.name,
                    borrowDate: offsetDate(sc.borrowDays),
                    dueDate: offsetDate(sc.dueDays),
                    returned: sc.returned,
                    returnDate: sc.returned ? offsetDate(sc.returnDays) : null,
                    issuedBy: 'Admin Counter'
                });

                await newBorrow.save();

                // Maintain Book Consistency
                if (!sc.returned) {
                    if (book.available > 0) {
                        book.available -= 1;
                        await book.save();
                    }
                }

                // Maintain Fine Consistency for "Returned Late" scenario
                if (sc.name === 'Returned (Late)') {
                    const fineAmt = 6; // calculated manually for seed logic (6 days late)
                    student.pendingFines = (student.pendingFines || 0) + fineAmt;
                    await student.save();
                }

                console.log(` - Added ${sc.name}: ${book.title}`);
                sIdx++;
            }

            // Add a realistic Payment Log
            if (student.pendingFines > 0) {
                const pay = new PaymentLog({
                    userEmail: student.email,
                    amount: 10,
                    method: 'online_upi',
                    note: 'Partial fine clearance for previous returns',
                    createdAt: offsetDate(-2)
                });
                await pay.save();
                // We don't deduct here because the "Returned Late" already added a flat amount, 
                // but usually, log exists AND balance was already reduced. 
                // For seeding, let's just make it look like they paid ₹10 recently.
                console.log(` - Added Payment History for ${student.email}`);
            }
        }

        console.log('Comprehensive Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedRealData();
