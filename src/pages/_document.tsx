import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="mx-auto bg-stone-900 text-center font-[350] text-white antialiased transition-all">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
