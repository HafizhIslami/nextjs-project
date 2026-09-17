import RoomItem from "./room/RoomItem";
import { IRoom } from "@/backend/models/room";
import CustomPagination from "./layout/CustomPagination";
import Link from "next/link";
import Search from "./Search";

interface Props {
  data: {
    success: boolean;
    resPerPage: number;
    filteredRoomsCount: number;
    rooms: IRoom[];
  };
  hasFilters?: boolean;
}

// this script still defect by allRooms fn. check later in roomControllers.ts
const Home = ({ data, hasFilters = false }: Props) => {
  // const [reqEntries, setReqEntries] = useState(4);
  const { rooms, resPerPage, filteredRoomsCount } = data;
  // const reqEntriesHandler = (totalEntry: number) => {
  //   setReqEntries(totalEntry);
  //   console.log(totalEntry);
  // };
  return (
    <div className="home-page">
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="container hero-content">
          <div className="hero-copy">
            <span className="eyebrow">Stay your way</span>
            <h1 id="hero-title">A room that fits the way you travel.</h1>
            <p>
              Compare the essentials, understand the price, and choose your
              stay without the guesswork.
            </p>
          </div>
          <Search variant="hero" />
          <ul className="confidence-list" aria-label="Roomi benefits">
            <li>Clear amenities</li>
            <li>Live availability</li>
            <li>Secure test checkout</li>
          </ul>
        </div>
      </section>

      <section id="rooms" className="container rooms-section">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">Explore Roomi</span>
            <h2 className="stays-heading">
              {!hasFilters
                ? "Available rooms"
                : `${filteredRoomsCount} ${
                    filteredRoomsCount === 1 ? "room" : "rooms"
                  } found`}
            </h2>
          </div>
          {hasFilters ? (
            <Link href="/" className="text-link">
              Clear filters
            </Link>
          ) : (
            <Link href="/search" className="text-link">
              Refine your search
            </Link>
          )}
        </div>
        <div className="row room-grid">
          {rooms?.length === 0 ? (
            <div className="empty-state" role="status">
              <h3>No matching rooms yet</h3>
              <p>Try a broader location or adjust the room filters.</p>
              <Link href="/search" className="btn btn-primary-roomi">
                Update search
              </Link>
            </div>
          ) : (
            rooms?.map((room) => (
              <RoomItem key={room._id.toString()} room={room} />
            ))
          )}
        </div>
      </section>
      <CustomPagination
        resPerPage={resPerPage}
        filteredRoomsCount={filteredRoomsCount}
      />
    </div>
  );
};

export default Home;
