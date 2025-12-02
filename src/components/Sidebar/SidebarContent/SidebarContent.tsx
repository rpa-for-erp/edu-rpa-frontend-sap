import { homeSelector } from "@/redux/selector";
import React from "react";
import { useSelector } from "react-redux";

interface SidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

export default function SidebarContent({
  children,
  className,
  ...props
}: SidebarContentProps) {
  return (
    <div
      className={`bg-white  py-[20px] mb-[30px] relative w-full ${className}`}
      style={{
        transition: "width 0.5s ease-in-out",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
