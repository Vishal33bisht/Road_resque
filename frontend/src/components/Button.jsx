import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function Button({ children, isLoading, onClick, type = "button", variant = "primary", className = "", disabled }) {
    const baseStyles = "flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg shadow-blue-500/30",
        success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-lg shadow-green-500/30",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-lg shadow-red-500/30",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-200",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {isLoading && (
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
            )}
            {children}
        </button>
    );
}