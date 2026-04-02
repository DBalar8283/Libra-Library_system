const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// --- Minimal Schemas ---
const userSchema = new mongoose.Schema({ email: String, name: String, role: String, pendingFines: Number });
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
    issuedBy: String
});

const User = mongoose.model('User', userSchema);
const Book = mongoose.model('Book', bookSchema);
const Borrow = mongoose.model('Borrow', borrowSchema);

async function seedOverdueFines() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        const students = await User.find({ role: 'student' });
        const books = await Book.find({ available: { $gt: 1 } });

        if (students.length === 0 || books.length === 0) {
            console.log('No students or available books found to seed.');
            process.exit(0);
        }

        console.log(`Found ${students.length} students and ${books.length} books.`);

        for (let i = 0; i < Math.min(students.length, 5); i++) {
            const student = students[i];
            const book = books[i % books.length];

            // Create an overdue borrow record (20 days ago)
            const borrowDate = new Date();
            borrowDate.setDate(borrowDate.getDate() - 20);

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() - 6); // Overdue by 6 days

            const newBorrow = new Borrow({
                bookId: book._id,
                bookTitle: book.title,
                bookAuthor: book.author,
                userEmail: student.email,
                studentName: student.name,
                borrowDate,
                dueDate,
                returned: false,
                issuedBy: 'System Seed'
            });

            await newBorrow.save();
            
            // Decrement availability
            book.available -= 1;
            await book.save();

            console.log(`Seeded overdue book "${book.title}" for ${student.email}`);
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedOverdueFines();
