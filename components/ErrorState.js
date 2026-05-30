export default function ErrorState({
  message = "माहिती मिळवताना चूक झाली. पुन्हा प्रयत्न करा.",
  onRetry
}) {
  return (
    <div className="dashboard-card rounded-lg border border-red-200 bg-red-50 p-5 text-center shadow-soft">
      <p className="text-[20px] font-bold leading-relaxed text-red-800">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-[52px] rounded-lg bg-tatkal px-5 text-[19px] font-extrabold text-white shadow-sm active:bg-red-700"
        >
          🔁 पुन्हा प्रयत्न करा
        </button>
      ) : null}
    </div>
  );
}
