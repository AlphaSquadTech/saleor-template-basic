import React from "react";
interface ButtonProps {
  content: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}
const TertiaryButton = ({
  content,
  onClick,
  className = "",
  style = {},
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      style={style}
      className={`font-secondary font-semibold uppercase underline cursor-pointer -tracking-[0.035px] text-sm ${className}`}
    >
      {content}
    </button>
  );
};

export default TertiaryButton;
