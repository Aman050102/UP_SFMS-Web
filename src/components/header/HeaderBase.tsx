import "../../styles/header.css";

interface Props {
  displayName: string;
}

export default function HeaderBase({ displayName }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src="/img/logoDSASMART.png" className="brand-logo" />
        <div className="brand-text">
          <strong>SFMS</strong>
          <small>Student Facility Management</small>
        </div>
      </div>

      <div className="topbar-right">
        👤 {displayName}
      </div>
    </header>
  );
}
