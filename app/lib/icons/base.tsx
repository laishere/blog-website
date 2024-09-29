import { cloneElement, HTMLAttributes, ReactElement } from "react";

type IconProps = HTMLAttributes<HTMLSpanElement>;

export function icon(svg: ReactElement) {
  const clonedSvg = cloneElement(svg, { height: "1em" }); // So we don't have to set the height in the SVG itself
  return function Icon(props: IconProps) {
    return (
      <span {...props} style={{ fill: "currentcolor" }}>
        {clonedSvg}
      </span>
    );
  };
}
