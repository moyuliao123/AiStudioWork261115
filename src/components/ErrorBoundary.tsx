import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || '應用程式發生預期外的錯誤',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E7E2D8] rounded-2xl p-6 text-center shadow-sm">
            <h1 className="font-display text-2xl font-semibold text-[#1C1917]">
              咖啡廳暫時打烊重整中
            </h1>
            <p className="text-sm text-[#57534E] mt-2 leading-relaxed">
              連線或資料讀寫發生異常，請重新整理頁面再試一次。
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 h-11 px-5 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] text-[#1C1917] text-sm font-semibold cursor-pointer"
            >
              重新載入咖啡廳
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
