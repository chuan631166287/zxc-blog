"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function Header() {
  const [activeTab, setActiveTab] = useState<number>(2);
  const router = useRouter();
  const tabs = [
    { label: "Home", path: "/" },
    { label: "Blog", path: "/blog" },
    { label: "3D Gallery", path: "/gallery3d" },
    { label: "About Me", path: "/me" },
  ];
  const tabClickHandler = (index: number) => {
    setActiveTab(index);
    router.push(tabs[index].path);
  };
  return (
    <div className="tabs mt-5 mb-5">
      {tabs.map((tab, index) => (
        <a
          key={index}
          className={`tab tab-lg ${activeTab === index ? "tab-active" : ""}`}
          onClick={() => tabClickHandler(index)}
        >
          {tab.label}
        </a>
      ))}
    </div>
  );
}
