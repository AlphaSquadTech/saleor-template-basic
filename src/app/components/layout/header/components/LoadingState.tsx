interface LoadingStateProps {
  className?: string;
}

export const LoadingState = ({ className = "" }: LoadingStateProps) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex items-center gap-4">
        <div className="h-4 bg-gray-300 w-20"></div>
        <div className="h-4 bg-gray-300 w-28"></div>
        <div className="h-4 bg-gray-300 w-20"></div>
        <div className="h-4 bg-gray-300 w-32"></div>
        <div className="h-4 bg-gray-300 w-20"></div>
      </div>
    </div>
  );
};