import Link from "next/link";

export default function Menu(){
    return(
        <nav>
            <Link href="/">Inicio</Link>
            <Link href="/practica/1">Práctica 1</Link>
            <Link href="/talleres">Talleres</Link>
            <Link href="/perfil">Perfil</Link>
            <Link href="/registro">Crear cuenta</Link>
        </nav>
    )
}