
import React from 'react';
import withBasePath from '@/utils/basePath';

interface FlagProps {
    code: string;
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}


export const Flag: React.FC<FlagProps> = ({
    code,
    size = 24,
    className = '',
    style = {}
}) => {
    const flagCode = code.toUpperCase();
    const flagPath = withBasePath(`/flags/${flagCode}.png`);

    return (
        <img
            src={flagPath}
            alt={`${code} flag`}
            className={className}
            loading="eager"
            decoding="async"
            style={{
                width: size,
                height: size,
                objectFit: 'cover',
                borderRadius: '2px',
                ...style
            }}
            onError={(event) => {
                const img = event.currentTarget;
                const fallback = withBasePath('/flags/EN.png');
                if (img.src !== fallback) {
                    img.src = fallback;
                }
            }}
        />
    );
};

export default Flag;