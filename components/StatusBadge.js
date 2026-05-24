const statusStyles = {
  "गाभण": {
    emoji: "🟢",
    badge: "border-green-200 bg-green-100 text-green-800",
    border: "border-l-green-600",
    button: "border-green-300 bg-green-50 text-green-800"
  },
  "रिकामी": {
    emoji: "🔵",
    badge: "border-blue-200 bg-blue-100 text-blue-800",
    border: "border-l-blue-600",
    button: "border-blue-300 bg-blue-50 text-blue-800"
  },
  "व्याललेली": {
    emoji: "🟣",
    badge: "border-purple-200 bg-purple-100 text-purple-800",
    border: "border-l-purple-600",
    button: "border-purple-300 bg-purple-50 text-purple-800"
  },
  "उपचार सुरू": {
    emoji: "🔴",
    badge: "border-red-200 bg-red-100 text-red-800",
    border: "border-l-red-600",
    button: "border-red-300 bg-red-50 text-red-800"
  },
  "वाळलेली": {
    emoji: "🟡",
    badge: "border-yellow-200 bg-yellow-100 text-yellow-800",
    border: "border-l-yellow-600",
    button: "border-yellow-300 bg-yellow-50 text-yellow-800"
  }
};

const defaultStyle = statusStyles["रिकामी"];

export const cowStatuses = ["गाभण", "रिकामी", "व्याललेली", "उपचार सुरू", "वाळलेली"];

export function getStatusMeta(status) {
  return statusStyles[status] || defaultStyle;
}

export function getStatusBorderClass(status) {
  return getStatusMeta(status).border;
}

export function getStatusFilterClass(status, active) {
  const meta = getStatusMeta(status);

  if (active) {
    return `${meta.button} ring-2 ring-offset-2 ring-sheti`;
  }

  return `${meta.button} active:bg-white`;
}

export default function StatusBadge({ status }) {
  const meta = getStatusMeta(status);
  const label = status || "रिकामी";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-[18px] font-extrabold leading-tight ${meta.badge}`}
    >
      <span className="mr-1" aria-hidden="true">
        {meta.emoji}
      </span>
      {label}
    </span>
  );
}
