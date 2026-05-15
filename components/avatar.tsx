type AvatarProps = {
  name: string;
  photoUrl?: string;
  className?: string;
};

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G"
  );
}

export function Avatar({ name, photoUrl, className = "h-16 w-16 rounded-3xl" }: AvatarProps) {
  if (photoUrl) {
    return <img src={photoUrl} alt="" className={`${className} object-cover`} />;
  }

  return (
    <div className={`${className} grid place-items-center bg-blush text-lg font-black text-berry`}>
      {initials(name)}
    </div>
  );
}
