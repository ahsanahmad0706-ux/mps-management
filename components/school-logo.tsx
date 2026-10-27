import Image from "next/image";

type SchoolLogoProps = {
  className?: string;
  priority?: boolean;
};

/** Official Model Public School brand lockup from /logo.png */
export function SchoolLogo({
  className = "h-16 w-auto sm:h-20",
  priority = false,
}: SchoolLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Model Public School, Kareli, Prayagraj"
      width={1024}
      height={299}
      className={`object-contain object-left ${className}`}
      priority={priority}
    />
  );
}
