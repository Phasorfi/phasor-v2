"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Github, Twitter } from "lucide-react";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "Swap", href: "/swap" },
      { label: "Pools", href: "/pools" },
      { label: "Docs", href: "#" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Twitter", href: "#", external: true },
      { label: "Discord", href: "#", external: true },
      { label: "GitHub", href: "#", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src="/logo-transparent.png"
                  alt="Phasor Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-display font-bold">
                Phasor
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              The premier decentralized exchange on Monad. Fast, efficient, and
              community-driven.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="p-2 rounded border border-border bg-card hover:bg-muted transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="p-2 rounded border border-border bg-card hover:bg-muted transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            {FOOTER_LINKS.map((section) => (
              <div key={section.title}>
                <h4 className="font-medium mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {'external' in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Phasor. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built on{" "}
            <span className="font-medium">Monad</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
