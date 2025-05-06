import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Link } from "react-router-dom";
import { CiUser } from "react-icons/ci";

const Navbar = forwardRef(({ onSearch }, ref) => {
    const [search, setSearch] = useState('');

    useEffect(() => {
        // console.log('onSearch cambio');
    }, [onSearch]);

    useEffect(() => {
        // console.log('Componente listo');
    }, []);

    useEffect(() => {
        // console.log('search cambio');
    }, [search]);

    useImperativeHandle(ref, () => ({
        search,
        setSearch,
    }));

    const handleInputChange = (evt) => {
        setSearch(evt.target.value);
    };

    const handleInputKeyDown = (evt) => {
        if (evt.key === 'Enter') {
            onSearch(search);
        }
    };
    
    return (
        <div ref={ref} style={{
            marginBottom: 14,
            width: '100%',
            display: 'flex',
        }}>
            <div style={{ flex: 1, display: 'flex' }}>
                <p style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#88ddff',
                }}>M</p>
                <p style={{
                    fontSize: 24,
                }}>i</p>
                <p style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#88ddff',
                }}>B</p>
                 <p style={{
                    fontSize: 24,
                }}>oletera</p>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <input
                    placeholder="Buscar Evento"
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    value={search}
                    style={{
                        fontSize: 16,
                        padding: '6px 12px',
                        borderRadius: 4,
                        border: 'none',
                        width: 200,
                    }}
                />
                <Link to="/profile/my-info" style={{
                    marginLeft: 24,
                    color: 'white',
                    textDecoration: 'none',backgroundColor: '#9ee3ff',
                    borderRadius: '100%',
                    width: '40px',
                    height: '40px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                    cursor: 'pointer'
                }}><CiUser 
                style={{
                    color: 'black',
                    width: '30px',
                    height: '30px',
                }} 
                /></Link>
            </div>
        </div>
    );
});

Navbar.displayName = 'Navbar';

export default Navbar;