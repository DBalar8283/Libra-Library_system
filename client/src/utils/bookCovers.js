/**
 * Centralized book cover lookup.
 * Uses Open Library covers CDN (https://covers.openlibrary.org) — free, no API key.
 * Falls back gracefully to the colored CSS class if image fails to load.
 *
 * ISBN-based URLs are the most stable. For books without a direct ISBN,
 * we use Open Library Work/Edition IDs.
 *
 * Size suffixes: -S (small), -M (medium), -L (large)
 */

const BOOK_COVERS = {
    // title (lowercase) → cover image URL
    'atomic habits':         'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
    'the midnight library':  'https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg',
    '1984':                  'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
    'dune':                  'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg',
    'project hail mary':     'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg',
    'the faithful and the fallen': 'https://covers.openlibrary.org/b/isbn/9780230748286-L.jpg',
    'wings of fire':         'https://covers.openlibrary.org/b/isbn/9788173711466-L.jpg',
};

/**
 * Returns the cover URL for a book title, or null if not found.
 * @param {string} title
 * @returns {string|null}
 */
export function getCoverUrl(title) {
    if (!title) return null;
    return BOOK_COVERS[title.toLowerCase().trim()] || null;
}
