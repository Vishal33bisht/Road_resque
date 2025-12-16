export default function StatusBadge({ status }) {
    const getStatusConfig = (status) => {
        switch (status) {
            case "Pending":
                return {
                    bg: "bg-gradient-to-r from-yellow-400 to-orange-400",
                    text: "text-white",
                    icon: "⏳",
                    pulse: true
                };
            case "Accepted":
                return {
                    bg: "bg-gradient-to-r from-blue-400 to-blue-600",
                    text: "text-white",
                    icon: "✅",
                    pulse: false
                };
            case "En Route":
                return {
                    bg: "bg-gradient-to-r from-purple-400 to-purple-600",
                    text: "text-white",
                    icon: "🚗",
                    pulse: true
                };
            case "Completed":
                return {
                    bg: "bg-gradient-to-r from-green-400 to-green-600",
                    text: "text-white",
                    icon: "🎉",
                    pulse: false
                };
            case "Cancelled":
                return {
                    bg: "bg-gradient-to-r from-red-400 to-red-600",
                    text: "text-white",
                    icon: "❌",
                    pulse: false
                };
            default:
                return {
                    bg: "bg-gray-400",
                    text: "text-white",
                    icon: "❓",
                    pulse: false
                };
        }
    };

    const config = getStatusConfig(status);

    return (
        <span className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
            ${config.bg} ${config.text}
            ${config.pulse ? "animate-pulse" : ""}
            shadow-lg
        `}>
            <span>{config.icon}</span>
            <span>{status}</span>
        </span>
    );
}