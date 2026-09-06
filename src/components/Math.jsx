import katex from 'katex';
export default function Math({ children }) { return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(children, { throwOnError: false, trust: false }) }} />; }
