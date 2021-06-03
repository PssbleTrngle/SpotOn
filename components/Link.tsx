import { css } from "@emotion/react";
import styled from "@emotion/styled";
import NextLink, { LinkProps } from 'next/link';
import { FC } from "react";

interface StyleProps {
   underline: 'always' | 'hover' | 'none'
}

const Style = styled.a<StyleProps>`
   text-decoration: ${p => p.underline === 'always' ? 'underline' : 'none'};
   color: ${p => p.theme.text};
   cursor: pointer;

   ${p => p.underline === 'hover' && css`
      &:hover {
         text-decoration: underline;
      }
   `}
`

const Link: FC<LinkProps & Partial<StyleProps>> = ({ children, underline = 'none', ...props }) => (
   <NextLink {...props} passHref>
      <Style underline={underline}>
         {children}
      </Style>
   </NextLink>
)

export default Link