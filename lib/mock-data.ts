import { priceRoll, priceTotal } from "@/lib/pricing";
import type { FilmRoll, Order } from "@/lib/types";

const roll1: FilmRoll = {
  id: "roll_1",
  filmType: "Color (C-41)",
  format: "35MM",
  brand: "Kodak",
  brandOther: "",
  stock: "Portra 400",
  stockOther: "",
  bwDeveloper: "Let us choose the best match (Recommended)",
  service: "Dev + Scan (M)",
  condition: "Fresh",
  pushPullEnabled: false,
  pushPullExpanded: false,
  pushPullType: "Push (+)",
  pushPullStops: 1,
  experimentalFilm: false,
  price: 0
};
roll1.price = priceRoll(roll1);

const roll2: FilmRoll = {
  id: "roll_2",
  filmType: "B&W",
  format: "120MM",
  brand: "Ilford",
  brandOther: "",
  stock: "HP5 Plus 400",
  stockOther: "",
  bwDeveloper: "Microphen",
  service: "Dev + Scan (XL)",
  condition: "Expired",
  pushPullEnabled: true,
  pushPullExpanded: true,
  pushPullType: "Push (+)",
  pushPullStops: 1,
  experimentalFilm: false,
  price: 0
};
roll2.price = priceRoll(roll2);

const roll3: FilmRoll = {
  id: "roll_3",
  filmType: "Color (C-41)",
  format: "35MM",
  brand: "Fujifilm",
  brandOther: "",
  stock: "Superia X-Tra 400",
  stockOther: "",
  bwDeveloper: "Let us choose the best match (Recommended)",
  service: "Dev + Scan (XL)",
  condition: null,
  pushPullEnabled: false,
  pushPullExpanded: false,
  pushPullType: "Push (+)",
  pushPullStops: 1,
  experimentalFilm: true,
  price: 0
};
roll3.price = priceRoll(roll3);

export const mockOrders: Order[] = [
  {
    id: "ord_1024",
    orderCode: "MFL-1024",
    customer: {
      id: "cus_1",
      name: "Anya Pradit",
      phone: "0812345678",
      lineId: "anya.film",
      email: "anya@example.com",
      allowSocialShare: true,
      instagramUsername: "@anya.film",
      createdAt: "2026-06-05T03:20:00.000Z"
    },
    rolls: [roll1, roll2],
    delivery: {
      fileDelivery: "Google Drive",
      filmReturn: "Pick up at store",
      notes: "Message on LINE when ready."
    },
    status: "Developing+Scanning",
    totalPrice: priceTotal([roll1, roll2], false),
    createdAt: "2026-06-05T03:20:00.000Z"
  },
  {
    id: "ord_1025",
    orderCode: "MFL-1025",
    customer: {
      id: "cus_2",
      name: "Mika Tan",
      phone: "0899876543",
      lineId: "mika.t",
      email: "",
      allowSocialShare: false,
      instagramUsername: null,
      createdAt: "2026-06-04T08:10:00.000Z"
    },
    rolls: [roll3],
    delivery: {
      fileDelivery: "LINE",
      filmReturn: "Delivery (+60 THB)",
      address: "12 Sukhumvit Road, Bangkok",
      notes: ""
    },
    status: "Ready",
    totalPrice: priceTotal([roll3], true),
    createdAt: "2026-06-04T08:10:00.000Z"
  }
];
