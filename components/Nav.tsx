import { signOut } from 'next-auth/client'
import { LinkProps } from 'next/link'
import { useRouter } from 'next/router'
import { darken } from 'polished'
import { FC } from 'react'
import styled from 'styled-components'
import Link from './Link'
import Pseudo from './styles/Pseudo'

const Nav: FC = () => (
   <Style>
      <ul>
         <NavLink href='/'>Saved Tracks</NavLink>
         <NavLink href='/tags'>Tags</NavLink>
         <NavLink href='/rules'>Rules</NavLink>
         <NavLink href='/playlists'>Playlists</NavLink>
      </ul>
      <button onClick={() => signOut()}>Logout</button>
   </Style>
)

const Style = styled.nav`
   background: ${p => darken(0.05, p.theme.bg)};
   border-right: 3px solid ${p => darken(0.1, p.theme.bg)};
   margin-right: 2rem;

   min-height: 100vh;

   display: grid;
   grid-template-rows: 1fr auto;

   ul {
      width: 100%;
      display: grid;
      grid-auto-flow: row;
      height: min-content;
   }

   button {
      padding: 1rem;
      &:hover {
         text-decoration: underline;
      }
   }
`

const NavLink: FC<LinkProps> = ({ children, ...props }) => {
   const { asPath } = useRouter()
   const active = asPath === props.href

   return (
      <Link {...props} underline='hover'>
         <LinkStyle active={active}>{children}</LinkStyle>
      </Link>
   )
}

const LinkStyle = styled.li<{ active?: boolean }>`
   position: relative;
   padding: 1rem;
   cursor: pointer;

   a {
      color: ${p => p.theme.text};
      text-decoration: none;
   }

   &:hover {
      background: #fff1;
   }

   transition: background 0.2s ease;

   &::after {
      ${Pseudo};
      width: 3px;
      left: 100%;
      background: ${p => p.theme.primary};
      transition: height 0.3s ease;
      height: ${p => (p.active ? 100 : 0)}%;
   }
`

export default Nav
