import { ReactNode } from "react";

interface BannerWrapperProps {
    children: ReactNode;
}

export function BannerWrapper({ children }: BannerWrapperProps) {
    return (
        <section className="relative w-full overflow-hidden px-6 md:px-12 mt-6 md:mt-8">
            <div className="max-w-[1600px] mx-auto rounded-3xl overflow-hidden relative shadow-xl">
                {children}
            </div>
        </section>
    );
}