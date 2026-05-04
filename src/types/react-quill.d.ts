declare module 'react-quill-new' {
    import { Component } from 'react';

    export interface ReactQuillProps {
        theme?: string;
        value?: string;
        defaultValue?: string;
        readOnly?: boolean;
        onChange?: (content: string, delta: any, source: string, editor: any) => void;
        onChangeSelection?: (selection: any, source: string, editor: any) => void;
        onFocus?: (range: any, source: string, editor: any) => void;
        onBlur?: (previousRange: any, source: string, editor: any) => void;
        onKeyPress?: (event: any) => void;
        onKeyDown?: (event: any) => void;
        onKeyUp?: (event: any) => void;
        formats?: string[];
        modules?: any;
        placeholder?: string;
        className?: string;
        style?: React.CSSProperties;
        id?: string;
        tabIndex?: number;
        preserveWhitespace?: boolean;
    }

    export default class ReactQuill extends Component<ReactQuillProps> {
        getEditor(): any;
    }
}
