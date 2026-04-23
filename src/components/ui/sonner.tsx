"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#061629] group-[.toaster]:text-white group-[.toaster]:border-2 group-[.toaster]:border-[#1D5F31] group-[.toaster]:shadow-lg group-[.toaster]:rounded-none group-[.toaster]:font-montserrat",
          description: "group-[.toast]:text-slate-400 group-[.toast]:font-bold group-[.toast]:uppercase group-[.toast]:text-[10px] group-[.toast]:tracking-widest",
          actionButton:
            "group-[.toast]:bg-[#1D5F31] group-[.toast]:text-white group-[.toast]:font-bold group-[.toast]:uppercase",
          cancelButton:
            "group-[.toast]:bg-slate-800 group-[.toast]:text-slate-400",
          error: "group-[.toaster]:border-red-600 group-[.toaster]:bg-[#1a0505]",
          success: "group-[.toaster]:border-[#1D5F31]",
          warning: "group-[.toaster]:border-yellow-600 group-[.toaster]:bg-[#1a1505]",
          info: "group-[.toaster]:border-blue-600 group-[.toaster]:bg-[#050a1a]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
