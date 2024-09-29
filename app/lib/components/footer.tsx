import config from "~/config";

export function Footer() {
  return (
    <div className="h-16 flex justify-center items-center text-gray-400 text-sm">
      © 2024 {config.owner}
    </div>
  );
}
