import styled from "@emotion/styled";
import { FC, InputHTMLAttributes } from "react";
import Input from "../styles/Input";

type BaseProps = InputHTMLAttributes<HTMLInputElement>

const TextInput: FC<{
   value: string
   onChange(value: string): void
   disabled?: BaseProps['disabled']
   autoComplete?: BaseProps['autoComplete']
}> = ({ value, onChange, ...props }) => (
   <Style {...props} type='text' value={value ?? ''} onChange={e => onChange(e.target.value)} />
)

const Style = styled.input`
   ${Input};
`

export default TextInput