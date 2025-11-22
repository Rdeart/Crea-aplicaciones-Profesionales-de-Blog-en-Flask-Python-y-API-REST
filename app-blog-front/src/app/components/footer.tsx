import React from "react";

const Footer = () => {
    return (
        <footer className='bg-gray-800 text-white py-4'>
            <div className='container mx-auto text-center'>
            <p>&copy; {new Date().getFullYear()} Cure Latam SAS. Todos los derechos reservados.</p>
            </div>
        </footer>
    )
}

export default Footer;
