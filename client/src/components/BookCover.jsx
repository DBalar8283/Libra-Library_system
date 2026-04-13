import React, { useState } from 'react';
import { getCoverUrl } from '../utils/bookCovers';

/**
 * Smart book cover component.
 * 1. Tries to load the real cover image from Open Library.
 * 2. If the image fails or title is unknown, falls back to the CSS color class.
 *
 * Props:
 *   title      {string}  — book title (used for lookup)
 *   coverClass {string}  — CSS class fallback (e.g. "placeholder-cover-1")
 *   style      {object}  — additional styles applied to the container
 *   imgStyle   {object}  — additional styles applied to the <img>
 */
export default function BookCover({ title, coverClass, style = {}, imgStyle = {} }) {
    const coverUrl = getCoverUrl(title);
    const [imgError, setImgError] = useState(false);

    const defaultStyle = {
        display: 'block',
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
        ...style,
    };

    if (coverUrl && !imgError) {
        return (
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'inherit', ...style }}>
                <img
                    src={coverUrl}
                    alt={title}
                    onError={() => setImgError(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        display: 'block',
                        ...imgStyle,
                    }}
                />
            </div>
        );
    }

    // Fallback: colored CSS class placeholder
    return (
        <div
            className={coverClass || 'placeholder-cover-1'}
            style={defaultStyle}
        />
    );
}
