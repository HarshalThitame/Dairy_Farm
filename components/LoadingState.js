export default function LoadingState({ text = "माहिती लोड होत आहे..." }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-green-100 border-t-sheti" />
      <p className="mt-5 text-[22px] font-extrabold text-slate-800">{text}</p>
    </div>
  );
}
