import axios from 'axios';

const api = axios.create({
    baseURL: '/api' // uses Vite proxy to localhost:3000
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('libra_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => Promise.reject(error));

api.interceptors.response.use(response => response, error => {
    // Optionally handle generic 401 Unauthorized here
    if (error.response && error.response.status === 401) {
        // e.g., trigger logout via custom event, or just handle in components
        console.error("API 401 Error: Unauthorized");
    }
    return Promise.reject(error);
});

// === Auth ===
export const syncGoogleAuth = async (userData) => {
    const res = await api.post('/auth/sync', userData);
    return res.data;
};

export const devStudentLogin = async () => {
    const res = await api.post('/auth/dev-student-login');
    return res.data;
};

export const librarianLogin = async (email, password) => {
    const res = await api.post('/login', { email, password });
    return res.data;
};

// === Admin / Librarian ===
export const getStats = async () => {
    const res = await api.get('/stats');
    return res.data;
};

export const getActiveLoans = async () => {
    const res = await api.get('/borrows');
    return res.data;
};

export const getAllBooks = async (params = {}) => {
    const res = await api.get('/books', { params });
    return res.data;
};

export const addBook = async (bookData) => {
    const res = await api.post('/books/add', bookData);
    return res.data;
};

export const updateBook = async (id, bookData) => {
    const res = await api.put(`/books/${id}`, bookData);
    return res.data;
};

export const deleteBook = async (id) => {
    const res = await api.delete(`/books/${id}`);
    return res.data;
};

export const issueBook = async (bookId, studentEmail, dueDate) => {
    const res = await api.post('/books/issue', { bookId, studentEmail, dueDate });
    return res.data;
};

export const returnBook = async (txId) => {
    const res = await api.post('/books/return', { txId });
    return res.data;
};

export const getUsers = async () => {
    const res = await api.get('/users');
    return res.data;
};

export const deleteUser = async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
};

export const collectFine = async (studentEmail, amount) => {
    const res = await api.post('/fines/collect', { studentEmail, amount });
    return res.data;
};

// === Student ===
export const getStudentDashboard = async () => {
    const res = await api.get('/student/dashboard');
    return res.data;
};

export const getMyBooks = async () => {
    const res = await api.get('/my-books');
    return res.data;
};

export const getHistory = async () => {
    const res = await api.get('/history');
    return res.data;
};

export const getFines = async () => {
    const res = await api.get('/student/fines');
    return res.data;
};

export const payOnline = async (amount, method) => {
    const res = await api.post('/student/fines/pay-online', { amount, method });
    return res.data;
};

export const updateReadingGoal = async (goal) => {
    const res = await api.put('/student/reading-goal', { goal });
    return res.data;
};

// === Wishlist ===
export const getWishlist = async () => {
    const res = await api.get('/student/wishlist');
    return res.data;
};

export const addToWishlistApi = async (bookId) => {
    const res = await api.post('/student/wishlist/add', { bookId });
    return res.data;
};

export const removeFromWishlistApi = async (bookId) => {
    const res = await api.delete(`/student/wishlist/${bookId}`);
    return res.data;
};

// === Search ===
export const searchBooks = async (query) => {
    const res = await api.get('/books/search', { params: { q: query } });
    return res.data;
};

export const borrowBook = async (bookId) => {
    const res = await api.post('/books/borrow', { bookId });
    return res.data;
};

export default api;
