export default function LoadingSpinner({ size = "medium", text = "" }) {
    const sizeClasses = {
        small: "w-5 h-5",
        medium: "w-8 h-8",
        large: "w-12 h-12"
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className={`${sizeClasses[size]} relative`}>
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                {/* Spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
            </div>
            {text && (
                <p className="text-gray-600 text-sm font-medium animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
}

// Full page loading
export function FullPageLoader({ text = "Loading..." }) {
    return (
        <div className="fixed inset-0 bg-gradient-main flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
                <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
                </div>
                <p className="text-gray-700 font-semibold text-lg">{text}</p>
            </div>
        </div>
    );

export default function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        </div>
    );
}

}