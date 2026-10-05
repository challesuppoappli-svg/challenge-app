"use client";


import { createElement } from "react";
import Link from "next/link";


export default function BottomNav() {
  return createElement(
    "nav",
    { className: "bottom-nav" },

    createElement(
      Link,
      { href: "/" },
      "Home"
    ),

    createElement(
      Link,
      { href: "/challenges" },
      "Challenges"
    ),

    createElement(
      Link,
      { href: "/profile" },
      "Profile"
    )
  );
}