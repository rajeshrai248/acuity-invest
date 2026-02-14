export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#FF6200] rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-sm text-gray-500">
              Acuity Invest &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p className="text-xs text-gray-400 text-center max-w-xl">
            Disclaimer: This platform provides AI-generated insights for informational purposes only.
            It does not constitute financial advice. Past performance does not guarantee future results.
            Always consult a qualified financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
