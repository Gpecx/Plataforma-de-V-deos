import { ReactNode } from "react";

interface BannerWrapperProps {
    children: ReactNode;
}

export function BannerWrapper({ children }: BannerWrapperProps) {
    return (
        <section className="relative w-full overflow-hidden px-4 md:px-6 lg:px-8 mt-6 md:mt-8">
            <div className="max-w-[1440px] mx-auto rounded-3xl overflow-hidden relative shadow-xl">
                {children}
            </div>
        </section>
    );
}