import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./styles.css";

type PopupAlign = "left" | "right" | "center";

interface PopupProps {
  visible?: boolean;
  anchor: HTMLElement | null;
  menu: ReactNode;
  align?: PopupAlign;
  bgClassName?: string;
  onVisibleChange?: (visible: boolean) => void;
}

interface PopupMenuProps extends Omit<PopupProps, "anchor"> {
  children: ReactNode;
}

enum PopupState {
  hidden,
  measuring,
  showing,
  shown,
  hiding,
}

function Popup({
  visible = false,
  anchor,
  menu,
  align = "left",
  bgClassName = "bg-white",
  onVisibleChange = () => {},
}: PopupProps) {
  const [state, setState] = useState(PopupState.hidden);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [arrowX, setArrowX] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const updatePosition = () => {
    if (!anchor || !menuRef.current) {
      return;
    }
    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const padding = rem;
    const arrowPaddingX = rem;
    let left: number;
    switch (align) {
      case "left":
        left = anchorRect.left;
        break;
      case "right":
        left = anchorRect.right - menuRect.width;
        break;
      case "center":
        left = anchorRect.left + (anchorRect.width - menuRect.width) / 2;
        break;
    }
    const arrowAlignX = anchorRect.left + anchorRect.width / 2;
    left = Math.max(
      arrowAlignX - (menuRect.width - arrowPaddingX),
      Math.min(arrowAlignX - arrowPaddingX, left)
    );
    left = Math.max(
      padding,
      Math.min(window.innerWidth - menuRect.width - padding, left)
    );
    let arrowX = arrowAlignX - left;
    arrowX = Math.max(
      arrowPaddingX,
      Math.min(menuRect.width - arrowPaddingX, arrowX)
    );
    setArrowX(arrowX);
    setX(left + window.scrollX);
    let top = anchorRect.bottom;
    if (top + menuRect.height > window.innerHeight - padding) {
      top = anchorRect.top - menuRect.height;
    }
    setY(top + window.scrollY);
    if (state == PopupState.measuring) {
      setState(PopupState.showing);
    }
  };
  if (state == PopupState.measuring) {
    requestAnimationFrame(updatePosition);
  }
  useEffect(() => {
    if (state == PopupState.hidden && visible) {
      setState(PopupState.measuring);
    } else if (state == PopupState.shown && !visible) {
      setState(PopupState.hiding);
    }
  }, [state, visible]);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (state == PopupState.showing) {
      timeout = setTimeout(() => {
        setState(PopupState.shown);
      }, 300);
    } else if (state == PopupState.hiding) {
      timeout = setTimeout(() => {
        setState(PopupState.hidden);
      }, 300);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [state]);
  if (state === PopupState.hidden) {
    return null;
  }
  return createPortal(
    <div className="absolute inset-0" style={{ zIndex: 1000 }}>
      <div
        className="w-full h-full"
        onClick={(e) => e.target === e.currentTarget && onVisibleChange(false)}
        aria-hidden
      ></div>
      <div
        ref={menuRef}
        className="absolute pt-2"
        style={{
          inset: `${y}px auto auto ${x}px`,
          opacity: state == PopupState.measuring ? 0 : undefined,
          animation:
            state == PopupState.showing
              ? "popup-in cubic-bezier(.44,.23,.19,1.14) 0.3s forwards"
              : state == PopupState.hiding
              ? "popup-out cubic-bezier(.44,.23,.08,.94) 0.3s forwards"
              : undefined,
        }}
      >
        <div className="relative drop-shadow-[0_0.6rem_1rem_rgba(0,0,0,0.3)] dark:drop-shadow-[0_0.6rem_1rem_rgba(59,130,246,0.2)]">
          <div
            className={"popup-arrow absolute top-0 " + bgClassName}
            style={{ left: arrowX }}
          ></div>
          <div className={"rounded-md overflow-hidden " + bgClassName}>
            {menu}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PopupMenu(props: PopupMenuProps) {
  const { children, ...rest } = props;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <button ref={setAnchor} onClick={() => props.onVisibleChange?.(true)}>
        {children}
      </button>
      <Popup {...rest} anchor={anchor} />
    </>
  );
}
