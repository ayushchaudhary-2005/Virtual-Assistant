function Card({ image, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded-2xl transition-all duration-300
        hover:scale-105 w-24 h-36 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-36 lg:h-52
        ${selected ? "border-[3px] border-white shadow-[0_0_20px_rgba(59,130,246,0.9)]"
        : "border border-blue-800"}`}>
      <img src={image} alt="" className="w-full h-full object-cover"/>
    </div>
  );
}

export default Card;
