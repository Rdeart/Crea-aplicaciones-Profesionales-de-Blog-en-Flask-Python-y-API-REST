import React from "react";
import Navbar from "./Navbar";
import Footer from "./footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='flex flex-col min-h-screen'>
            <Navbar />
            <main className='flex-grow'>
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
