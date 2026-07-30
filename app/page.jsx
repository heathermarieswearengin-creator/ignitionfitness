"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { studioNow, STUDIO } from "@/lib/config";
import { to12h } from "@/lib/shape";
import { Theme } from "@/app/theme";
import { AdminCalendar } from "@/app/admin-calendar";

/* ============================================================
   IGNITION FITNESS: landing + booking + admin (single app)
   Aesthetic: "the forge". Dark charcoal, brand red and gold, heavy
   industrial type. Bookings persist in Postgres via /api/bookings,
   so the booking flow feeds the admin dashboard across devices.
   ============================================================ */


/* ---------- data / helpers ---------- */
// Presentational metadata only. The bookable schedule and per-session capacity
// now live in Postgres (WeeklyTemplate -> ClassSession) and arrive via
// /api/availability; this just supplies labels, blurbs and headline pricing.
const CLASSES = [
  { id: "group", label: "Group Class", tag: "All levels", price: 25,
    desc: "Small-group strength + cardio in 60 minutes. Drop-ins welcome." },
  { id: "pt", label: "1:1 Personal Training", tag: "Private session", price: 80,
    desc: "One-on-one coaching with Mike, tailored to your goals." },
];
const CLASS_MAP = Object.fromEntries(CLASSES.map((c) => [c.id, c]));
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Brand logo. Swap this data URI for a hosted file anytime (e.g. "/logo.png").
const LOGO_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAS0AAADICAMAAACKw0dZAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAAA/1BMVEUmHhze2tqlEhxpYmLTDx2inZ0wHhppaGhcGxTcnyRVT09HLRxtBgSZaxxtSxRjYwH///86HBPdo6qYZGnbWWe2hySqqqpDNS3//wDWNUj/AACiNkZTTk3baBvpeIlTQyqqVQBmA2amWlrCwL6Og3DankLnucP/fwCFfoA7DgQAAP9GP0FzO0BDQDz/f39GPUGqVaoAAH8AVVUA/wB///+AfXyDgH7/AP//qgABAAD8/PuIARX5sQb3BBdzBRL3rQ4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADfTAZaAAAAQHRSTlMi/v7m/v1dAuz9pqEC/vACAZP+/P7+A3AB/gH+av79pAMCA/7x/f4C+MgBl/5sAn0DAgMBAr2xAQMA/v7+/v7+FDgKAQAAIBBJREFUeNrlnQdj6riygGUbF2wDLhBSTi+7e/vr7znkwP//V08zaiNZNiWQkKz23uRAKPbn6RpZjB07Enbm0f/AJDn7l7z9sUjTtINhgWKdGPyP5dUdcvfiI02rSj/gfD7oY6i6PI6jKP/wwUDrqkoyvYLx8rQkKU7pw4c8jyLOh3WKRxQ8BnzE8R8I7UOi33Vzk/4ZaXWICSjFAObx8TEuBK20YxE8xiGg/RDM2J9UttLuH3H8XWKSI867G3EsSfzoDP7C76CdnFry56PFTVPQIyJppdxsPfoH4I0SZff+RLLloRUJY+b7Gxlxos3bIv2z0PrQeGjhuNlDi3UlugeQsYq9M1qgMT2t4bTinl3KlaOURj4AB9Bj+sMEGXnyOhrJLidE9m/90LLkAYRX2uVJlxhE9ecoluACVwIhyIjbvH4NE3ZB2Ury6EeeuLg4khhGoNxhH2QAT0qljFv+2gZcKKeV8v+KWECUAvaypuRCX1Z1SRRLR9bDVdSJAVOp9McEEEGeftNixp+teXTWxvKTdESmgVXvQLaUCYo6r7awyAoexKGsBS0erXadEL4g11rKRPwaB1SP4+gz694PLer35SjTlFWdkh0qGkwE+PwtnIqimabGOpVd7URkIGDsbdIqaVgV28GUq6malpMV8dQxNybse65Yl+IHi1x3GfSvx1uTLZPyBTH760iQGjPfqTJpzMELlM7f1nkUBwNR65uixXg40IvZ49xzMoaWfapskVbo+syf+0eYRIEntn1TtCpQkoabEcfB+c9Ga2pc+w5B0/K51KqzaPFPSN8cLTh/LL9EIiI16bPvdDRMr+RxP/nfOoDwBHKxjvjh5xv0iUaWZHEvpcJV9dmaSNQrGfqv1ZCD4H/MwYdG7O3RIvkfHD8zeYzXDGsvwHl88x3WGMtIOwieL+RvMd6i2XKDuG72BBGS1v94/qYlL/7g4aykMmLpC4bxF9JEJV1WENGLA4zX86L/LGmte2/UovUdSKbpzRvNE4mnAuuc/lPb+aZvfkYDLuMxfaHUj7FIrfOXPq6Nll1UD1AZtZ1vu6OA3CjyUU8oVRHCr960gpNetWzZYRBKlwkiCvfgmcr4+J/YEC1vqKZsvM+k8aPQBQ2v93g1Wmk6IC0Gl7b8/dPWgtd43Z6qQLjyk2pvGfkUEQoVTBwKj2urq6GVeoSdORkJGwkiuGtrh4KEdDiA0DGvD+Q6wopXBU4iCNriamQrFdcxdYSreXRwDQsXCbhujgggtCK6+BnmEkEAmSp+dACeuboGWhWUkVsniSv5SQYOrmHhUlLCPUDfX9aaFhsMtvqExefFucq6m+g6aEEZAGbe15YpddJdPCclbj3N0S6g7R3Cvw1WIKgi3rg5fWAqqpeqTrCTtDBX19GSmLQ3Mx9EtZq7cYOBoZqNVSpkA+rbe1PqXqjLlAnZM2DB+VhXvydc/AXRQJmLBlzssMLqcLCl/0BHk5895mLHv4GR2qXtyD0HPagWKSmPsgMDCK2IDnou1D88/QLs1WkBrGbwmPrCZaZPHRligzUbWs1xrDRrfRbA97VYVqte2W6lTpkXq38VCcIHu2Tcc0/30+Iu0TLlpfp0Z9qNxMUBzVXP38J0HK0bN0hwNCmtWByM9MgwX82m7y0LXYFgfkW0EilmDorHWMRK0InwV5Etbd/5segjJKX1GzKX7BEuW4hU7X2wPGHjtYKt1JtDcD5/+4PgOnfAdQytyoJVREHfU+sg0Zh3M6KkSn2SwoYDiNKncHawxZ/+jU7/JES8zu0W2TE2ax1bRiEicUTaK3NxpejrrJdWLyzyBxAVyXqYr1IUiCIkuaaP8StqopF4zqc0GkDCSIOUh1qxvwdwvMLFP7f1uQVGFLHyuh1hztKKPnXeAPUkWnDVmWVdo75wcQV1HaQlXGSSLKW9DtRZ3lgeRsrid/opFTFa6iBIQBGz15ct2YQMzss8I6/3NzN5kbvxhCVczGrX8gUQluKWNOthvuBBCTiJkYMzm/mT7FYgC57kWPkzN7o4JYWrZS4uc6IgTKZHiyXJmo2nRIxkPf3KA3k50c2zZ4rH+UQVxgetOhMtSPrcKlpfZjYuW7kULez/05I0kG4bG58TD2wFD6mbYMfnzhSP02vLruOEdN8x0klq1rnlZ0WAJbAcIzChmRaZfgUixf9U/YpUeCw9NLDH9DBNy5eilVJc/WdkzFjREiDHGT+6yy5S0YYVuIXpcjiAuCHBVuUJ4n+QazWsh+L4Xkq2SHlUzhHajhEP54bUl3EONnaT8NS3RKUV55bqJkstGTW2lypF/JdCYOmhWio0qodYH2cvpomWXVc2qO/CjXBhRwTFhdfbR0tZabc2gZcjjvLPbok5pR27B+khtg7zjzpduvbSYmnn1QhxPZkdOQuAlXbhssmW2C4829SZHhJv/odYaqF7dXMpqWD0A5WWGkW0AgXm2kwtq/RM1y10kj/D9rND5MlbCHgM/kisPFsn2KmqQ2EHRGrbrthp5BYrngLsLPoPZXjAoimrY4OFZ1Wg0LoRu083PSVf/qfqIrS48DK3qEvsesLs7EbFEcytLxvpwlgUkSOlJhbr6QqzBpH9K5J9WQsiajrSY708TOfOlUc3qRaSo7wELTnp69TeCK5+HZ5Rd28cmzlUHgGk8LmC0j8Sn93FtenesqhaUmAH8VU5pJvKO3Vr8jknT52xPZVSaF/P3bfoKnhgFkY4CXZvHlHjitfCelNKVfqVpV7V57R+c6bdhOFhvUBhOHhIHYMRnRriswOiUbdZETo+3J51HWl+h+vma6MUuILGuurfShjmo+/v4TFjaarpwZKDoL/688PhQXwKKUVgdZddQBNvzPIT+2X/5eR/cLU/x1bK7U5Sg/42AVk5wcqyslSvF9tpiCy3lxQgLVqUwW8oLd1M7bliWn9+xlwQGwtF8/jRP3Vqx1DgrGnGWAjD5C5s7cBOMUnif+XXJ0ldF5kaRVHUdZLAek184X2pz5cAwwuQB7T8zsaC+Jo6YFhElJ5ftkiUHvvWzQXUDFRppQGKg6VtlKohB77sn2l3LzjVCOihdcfDAzzPqUmyoveJrZVGAn9GlkcJaamYVw/tgJDb92dNBA3TMl/feOZHiarJFmaaYLOhtRg8qQVxAVJh2y6Xy0+fPjX8fzDET/jHp+WybREZEiuxIApL9VDA8ANTCkHUvRtPEJ/ac8VwrP+mD+X4taBspDzz/bFf2XUrvLj4gnkS7CoxZa5KvwmjdY4KQKlxR4Z8CvlxYiEAE7wWCCyJfsTCLFgzm1wbSfCQQKCmo6zAMq/yWGU3dHkmWky1FYt4MvUpKr9qDRzA1/Imdcpw4BZMxVkfFdfBpOBShZAmfIQTHKE77gQzLmNcwkDAQHu/CmCMiI1xdHF/Tpz/+uwEDvwDUnHxWJLnRwcSbCTSMpeEdTe+hAi/sJM+z3oTSBwGEUH8h87sOLOEa+Dk7m4yUZT6oOSYwOuAGQqYuRWQdeieCf2GrNHrBQ4pE+fBD7yNm+Zo78j2zu8ou5D688cU5jPyQtYLCpJyc8V01lqyYhtOzEAqG+8QwGCAFIbbrNZqsziwV+SG5DrSYtyoOqS8J8DRZXu2rzBjNN6zbq5KS1TAWAboN1bQsY4is+6Zn2u93VikkMvWNzQxeCkXxTDcFqz35d5eEV2dd0xWIYWKhiKPTrveabQ8bWuDMZ2wVjLESc1K3ljGTEYtMi5Yv379EqyGONnElIDxd3DzJUKPoStqOWBPrkOFaqCT5SRa1LsF49qoZ8lwnrgyVRSNz8DaACzFanvQULz428IN18bSZywCY+GVHvYChwSij/4tOc5Bi67EdFpWPM3aLcmOanLc9GX3AAtPGk7bYmWZK/GEjxe8cZvYuNRMWpSTdk3lnb9bd+jwoTphUshvt6Qz4fKUmN62II480wI0SiVNJU7lMgHz/uvXOCuXm1HICaqwjauSRwnXRSSCsrqW2rmO/z4vQxndaT4RO2jQ9rgxc+rVRNEmEnhrIqWA5QiW8nxDQ0LbaFxgvJLeUQKib5h4y4vpmCxfb9TJlRs2WDONcEIU8qx2TBsrkvqrl313DoNlDqw9oCgx+XJQ41+TTWZZejhKvB8Ck7dOSsEtsygeu9XSmKqcKls8NMmFCbTiFrHAwW2+dptDbP9533Gb9UtZd/6/HpTMGj1kgi7iCgunpatjZJIwFeWKQ1iRNOgc0alVyowcbWSdr53DfxhlV28mOmyw9c/UaRIx6po/cKHJd4E2upaeuN1UFDnW8WGw3NN4bn1Lz4HbkR4mQoPlm14BqVR66LJCTom3gAJVr4ICk7ZL6KI9Ft1gkXRkNKctMTsUL80iGsfYMzJZ5ekk5mk0T6EdWLocQwrMMO7vDbJC81LSxU39th5xY0kUH6iFrDulH+JAWrajQfkxPVRfGZnjca4Z94fZA6R6rmAlTjnZqTLj84mDC2iF2dglHYgUgti+tVJx4gKnQ9/kaqO1mi1lMo5oem7mvivCZbN0JGubMVJGHqx088BJ8VK4+jEqzYSCAVRRFJ+lkf4YxNQ1E21MWCdTa1NGJSMztLRk1YcpQtnHNQG3eL+nxmShiqIPdBbjOVM+x9BidqSqJg/E/CwPc9Yf+pkk2vi75Z0lWll9RFNP3aOVDQh/79ZcIFT5mjlTPvkzlkcf88aeNiZ4jMHIEYDZ0v5QVvnGLI8vq+C4Njr6EAF96S+NBxaqNipQ5YqWaGH7nCmfIzFXPW00i3IZY6mHVoHhA6U1cLZDwsW4LkpaW4y6Bt9PKidc/1S99Uwm67T+re5vllhHwegyU0UrNOW9TXGk864ziOUFrQ0PRsKBDxCeWehfogJWdq6J11No9bQxeNxL647Qmgz7tOFDzFSpYrvZPnxaDtHCDJ+jkkKVfvVN+aQvKVu9RMjU/v7d9+J7Sgv16EirhV7VFHa2D82nQVpgKJjJ21I7DQrOcIeI09ZVU8Ppv5eI8WnhckJd2sYfAIxZroLQCj99Coc/oSIZ2zfHhZ/jfgcnr9m3guNoSMIFrY3xaMebLf4RpmqItLLRK0nmC2I713l+7/yp94NwJ9bHaN3peS+glRxNK8kOpuXWM8/SK/Js2QJjT1ta2PCphsslpbV9Pq3ikMP721na285Di/Zfx9HwocCpLlWW+AxaW1WtDz8ts72W79yBwxlo0Z6H8nBaJ2lipmk9NG1W7D02MvciTNaZFt6drIl1PNCX3gvFH5aiwrzZTO5O8In3nFYrcW237aeHfbTsbvygrbuu7F6T1ldT//PdbczJqnWvA9AKs6O/Mvn7MhS6uM3aZbiPlnWXOcjOzndrQXaiaKkDavbN9mKaJ7KWDQSqx8byjAe4baNohdCiVO+TTmbaFCN2zlsjnvhRlZ6f3VupKjI9MSjC+uwoVWRg+ZoHSeth+dBriBjOr59XnjmjlRfx/P7FpfcyttSTzly4+rdmLs3oF9UyHoOEUrSwwZIdIPpYGjn73UaeQR6qpcV+1yz8v6GFusjcErzNjtq9wnR5cVrhNssOOat1fD33dpOu58P6sBLCdqN7smAiYpNpY6IWwqqh+uZTpd+syMKHUHnE8GF7gNkSRfooP//d85/xeYcGfHVm+kPEtI3qZ0gFKTXbqprmcebsW6k6L5dNK2nh/Ed24OQWu8AtT59F/7AWagguDa3Jr8ndw4Nq/0iyv//dN9G/loLFAS0bTmsrS6ebgxTxYuMl7qBNaAGuOzj/CHglESwmcHtPw/ChhZo6w/mehybgHlFVAzfbgxTxLdOqtxYt7tgaziursxZ+hb4e3baJI86KBwwcrc4F+MccEj+8bVqoihoE9ES2TfBby3+2D5mv5Y1D4SAfOLNm2UL4IHEjre4damK5YGyx6LpbYeezLW3t3mZNwPWLO7tsoEEQ3B9IWNC0qktV/HxV0Trzfj4LPr58ue2nxZnuUQ4h1sza37hsZT1Qod1CHza/cVq0u9LyiNWXBb8mrHxLtEpk5BDCO9Os10WxlrkiCheG8suGg+K2K9x6lxQsl8sH0+nVEligoIPT3LcLMcprpFWKY7MZQZAJhIpszsdsNlutVnOeQ9/LChWGD5M7bpF04kj7jTDQX4KOgp/E57e6UiM0MdORR4FNcut1kvS30L0cOXY8o54QJUgoE4RmqymO3dPT9Gk6nasgIpN5z2TyIAUmDMnKDPkbYAXBbw2umTI6Kcy8Fq1FV89+TqerFXzfDC4NoCvWiYfdly9nJMcOIlR++b2HKJEyhIgUI87nabfjpPD/T9OZXP2WCFrYMH/3CUIC0RlJBq7pacT6m6BZTkg/odHETtJK5lP4/B0M/GJJTqADdiKPss/l99+/lM9Cx4aMEbee5Zd/9jStNnrGFW0q5YijeRKHjv94Ev/itLLuP1X6E0paPIDi0abLCmihYIm6FNDCnm/Ka6s7IG67bCVw6S8WXzql6OZK6nwyd/sFzvFIcmxPOsOwB5SK0YoA0mOnhnmC/9Ci1YmFK8IwgZvrw+IJEWoh4hKwcEUB4WVqNUK41LftDC7riCQ6Q25eyIZgW+iqlKXPkS2JqPhsK5q6gh5KNjw5phktcwGtO9H55oHFySw/wWphuNVMo/5OV5vRvi8QLkHLOZgn71BiR4UOzq/wOYkjaDGOSYmRUbSd5zL2h3OEKFq3euIGaS2XAtYvzxCGniMLDK1fdGUsWYlRCuF6Onyo107VWAl0/FQ/fy4OhNanxZ1b24Lz15/ru2S7JwfQzj323W5Fq5yiD/xuSLAIMG6+mokLEWmRj7vtitn0aQ8v58DVVZ06xLhxq0+jJcWL2HIhYgTNTtnwPRcTRIvYUKSFLVy/RgeI13LSp2j3FJbKLe6RJ3LcBJLxARkYMnaOCMKy8AjOVszdwDVUtOy6HSy5m4QjgkXReJ4M7ZlIEK6nA3TRDjF0gFH344sTaZW9RAbBgVW0HSMEWMYDuoc5q7tbIgtA6xBYnIz/WXsZxqJjxC32Gdmmaf5ZeUNf4H+e6NSfAgqB++xGXe5xrzKzcHzRieWch7AaZOjMRC64cO2e+kEDESIZMPTP8dQQ9VBpxEiuzw0l7rMMNCxgOxVrlarGhfHWr9ORYVuhmQ8qe8I1nYF7k3EB8yWPZXnhzMefC335vZdQ19nKOvQM9LAUeU8xn4VqVfXd8mRa21qLqswWLU88nSdeRFdSsYGSX6lyyGQmold1netOyCKgmk1/TkQqAzdiOUG4JlK4MnXHvEUphMvSxFnG/u8LZDSXqtycq1XnFo/c2BEZawlUfHyUsJpmuTyellTfSfiRWyQdHAnhcmKWRXfBcSZaYHKnJAyD44Yi1HyGKSXQkolzg+WFo2nJldUfRbSkiIHlIkaepFrXTMvOcvlFnma1RgWPpWg9IK275bGmS1fAPk4x4uTEuMdbM1ZQy8X/OSsuKlxnoQXte1MSde24BZnPSC0HaMn6Q/sA86lLX4o42Y/ro4pUdlMkllHhkoa+vHJat102s3LcnYy/dhYtqF+1YdinJfPmUVyhqFN/nO5oBOqGLTw37W6vm1bJre3Urp+Yf2OdaypEC6bFoIvL0cQJWQk8brmQ1o5mW26ZbTpbX1AX2Vn0cG7VKXZOnWS3E4qIs4NyOXmP1h7ZUrg+Tne78aRwzq5atkAPx07BKGITZoOwLLvlsWHSco3REg7gkoaencMfzqYH0Vq2Yp6sZ5IshBMdMHgs12SipXjXF6yLG3r2fD1k+6qYyiU+LB82Q7RCUi1Fq++jhcI1Uk426fy10lpwPXw6iFYYtuEQLfmsDCQmocfkH0wLkq4rpXUPejhOi9sSOjnopyWelkSktPVeBu1M+2ldUBfZcyVL6uHOChv6tHSc0C/LW7Q2emFxKJOdA2mRiGI6u1TQ9WxNLKSJ1/OuHkUcpTUhtJR3JDP/WsQMLc/0l87n4R/T1aWiCPbc6KGYm/qpLNhrp6XnWKQx0kujnPkcI1uyf4T2J1FaIadlB+8a1tOOTFBk7FojiKTG21ObKaKVO61my5bGJSc1yE1qBC23TWlCA40QAy4DzJnFEXM4ydX6RDrToe4EZcDJmr1Fa2NuN0wFaYDWxkcLJMmqwXNKdcIu3hZ6hm6321vv3BqdXAstWm4LoJ/WdoDWT9PakCEkh9Jicc20yAxR6ZttAoHbhr/c9iL7/pOHylYYZkLdehMVt/dlWV6/bA2AK8ncmpjVD4dv12nL1naEVvaXxJ2neAFKl6Vlz62Vcp7ag2JEEx1aMmQVnSPnmO26UlpdR2ltRmmFro6anEjEGRkrWfdq4wW+mkHzlqI1LFo+WptNn1b3nmmVTDVvjdEKJ5TJMK2sgA+87DTYK9K6NWZ+VLawjDxGS/whu+gkxSvT4jIAgfW9aLAZN1sTTxcz/sWk3rgUo0vmWcL+unhvtEAKeBpZdF+w63SPlQ/9Gz9QRdzivSyL2QoTwXfnE5P5bLrKcL5xM7gHxuYAXynVGPt0C55OzSCSWLwfWqCEGc7AZvAl2fZEWKpKqEQLewJ3uxXyYu+DFrS31fMV9kDMxQLpzemihVYLFq/UsskNPnY1r1/cO7ILGSzGDdZUNnKxW1wivTldEeWN5sEj3gpaUPSbQb/WbfmCEnaBbyqVEsoCFKiMvInW9ihkW7VpgVRD9IiKliwpv6z5YhdRwmy2MrXAOYbfcDub0Z0wBqPWidRDXEHGP6ueqSL8lKtj8ZK82EWUcEVKp9xuLcDtfwy3J9HS+0Nks3ktWtxIyzkXr/rlcJ2XVvk7RlhTq6l/LuY6fkpc25Nh8cABdoyqZ3TaB558MfFi55MpEWHBSe1sWoyJUGKWHYtLlcXgjVBjBkP111p3IUl9nM2LtydbC6OE1jzD/C8ZTtBOp+GRuOi+KyF2ak6n8+IvM7JGS7YhzV9GvNh5DdbMLGxR0sXlYSaenCpd3B5BS8LKVFcmJzPb9RdevIx3ZOcTrBqjBnFK3FvptrTpSs36TWdH4TKsDCxEo5spzbzly6gjO9enqAgLO5hhAnSmJ/t3pHMvOxxXKO+bwd+S4cSYM6cPUjaV64XxS+cX947sPHLVocGSojSDIKieuW0RgmO2PUa85Gt9sJ503/RUzOfzL4bwlV01rVLWGqZCA6GXHZ3jbOpZOvyT48q2hwITSmhg2e2aGPbK5Qta2orukqWcZ9O6FUooQ5+Z2KJ1wbq1QwslC2QrI7i2+8UKYngpP/Yyd2g8kndPmM9WKs1Ca397tb2BcLAr2YswFxtRgHuEiLu3phJgJrir9zgva8dJvN/bzFpE9KTXe7CSAJsK4c6S65Ste1mXEaiEBi6kxBUrWwcBlYAJS7ezw/bmRFQJ5IbZ3G2NxzV92k7hK2QHCV608gplq5ZR+lzswk1UIFtRVAATV+YIUfjLobzM5stMyY9RRtEaz1TROdHAMHe8vypa92iwVj+N0JT047KpWZYBMJl4hXgBaOM+TNstuctPSYDplGole71ZRxdCzlC8souI18m0vqLBWoGxQhJuo002lcswYP1S0rmuio3zQtkju3p3Wn4KZdL5ZSj6kQw6SbiEFwm+Tpetet7+AFRAor94kmXQ8WYsf+/AmSNferNJ86BOPIEdl59CxCvT/vq68raTC/1+/JjNk6uRLVCK+RCJDlcOglgJuRtYiWp7RwJLGXd/XVYtfPz5c+4LlQWw+Rzua3kld4flsOawaJcNSTvLQAPh07+M6APyylyTb++t6E0dGALLRs6JA4uicwcTp20jyM0Hns5IGJgkg3LnfFRtb/ua1Xtv/lF+Ee9kY1MDSLRmVyBb2JaXsud8OOnsY+Y+zcmhtwAp9zXEl3hbY8auwm7tFZpycemZ973Azl+PuNj9Tsvj3+G9wfxVjQv32KR6gOrir5QO0JhU3k2uFL/JXwU5/f7OPDzlclw9LTqqPYnBwEitf5RqR5D06/uTLWaGfGA9xxL1sDMmmVlvEt5V3bknlTfPYd0Fbh7/2rSKiIwaf1pPRVEuHycdK8Rv6wUJfkYMuyKKXXlZjo/aKGfvS7ZwR3kz4iiGX+KnHq18ScRYy381kfWeJu/w9XAHVNx4DbbWg+03A9x0tnpHtBacFt1iMfqOO9rYG//GclenOGHwhyBPWrqJZV7QTf0Kaw+os20udj2yhTfGlbLV4Dm2gb4FLMiU2jc2Z7A/kKKl3yM+oWnE3kF5LLdPhYfx+j3SiqWFkrQyeIAn36IZ0zvOU9mS74kyfDL+LHasE4IYcAuIYpq/O7uFSiZNfiP1h3V5oDfW1dsKFpKW9R7cGg5eGBlacS62bhzamPft2i0vrc5HSxg0LmLWe8RuZ9y+58IvBnLrSHSMxcub+RegBbeCTAitVNOqzP7lQaxoCT5wE/ZEwgziPIEwqxM2n78I8vDXCCEuTytAscgNrZuebCFUSgvfAztj1WKLzVjsKKY3Y4teaa3P5WlxFgGgyYM+LSlbaIYCQkuMNtGb8crdSOVm3dyXFu8sll/QLTJHaXFJ0taL0BK7fqqtsUG8Sr3zM8aq71ITReTU5cOaGEcOLaWJZWq2xuZvTW946tNqXNU7pMVtFh/rMbsV6700Ixlv1SJ3Fmm2FK9GhAySXtC+q1j+61AE4aFVt4FNC9/zjTGMa6W5CmJMzNesQFzNu4pONa06TW8WN4ZWpWl9+6ZoRT1alYhOQYvXcidxnjxhAi4dafQuaeFmp5VPtlS8FSdy011DS5S3avEeuYNxjD//gOD0z0hLa2Kigg1JK7DzxCiSv1EDI2m48ndN6/sILcFS05JFiCbSXhX/KGN5UcN4fzWIR02LW/lgjFYSW7RUfauOSciWdCSA4/FF+o5kq5O1U0GLh5kxSkvHaeE/YxGdouFOYENueC636608X1LFViyWMvWo4a98ha0BL5pwrSHSUhV0hg8S80/RriCCMfOceI8c0Fn+IccwYi022UjEozzpXmNcehX6YV9fDh4PmZ9PzZxQB7uxvwKt/wcwOVM/eq6/4QAAAABJRU5ErkJggg==";

const iso = (d) => d.toISOString().slice(0, 10);
const toMin = (t) => { const m = t.match(/(\d+):(\d+) (\w+)/); let h = +m[1] % 12; if (m[3] === "PM") h += 12; return h * 60 + +m[2]; };

// The 14-day strip is anchored to the studio's calendar day and stepped in UTC.
// Building it from a local `new Date()` and then keying it with toISOString()
// disagreed by one day whenever local time was behind UTC midnight — the chip
// would read "30" while asking the server for the 31st.
const next14 = () => {
  const a = [];
  const start = Date.parse(`${studioNow().isoDay}T00:00:00.000Z`);
  for (let i = 0; i < 14; i++) a.push(new Date(start + i * 86400000));
  return a;
};

function relTime(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

/* ---------- icons ---------- */
const Flame = ({ s = 18 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 9 9 11 11 11c1.5 0 2-1.5 1-4 .5.5 0 0 0-5z" fill="currentColor"/><path d="M12 22a6 6 0 0 0 6-6c0-2-1-4-2.5-5.5C16 13 14.5 14 13 14c-2.5 0-3-2.5-2-5C8 11 6 13 6 16a6 6 0 0 0 6 6z" fill="currentColor"/></svg>);
const Bell = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 6a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M12 8c-3.5 0-6 2.8-6 6.5C6 18 8.7 21 12 21s6-3 6-6.5C18 10.8 15.5 8 12 8z" stroke="currentColor" strokeWidth="2"/></svg>);
const Check = ({ s = 14 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const Clock = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const User = ({ s = 22 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const Lock = ({ s = 26 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2"/></svg>);
const Arrow = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);

function Logo({ h = 44 }) {
  if (LOGO_URL && !LOGO_URL.includes("__")) return <img src={LOGO_URL} alt="Ignition Fitness" style={{ height: h, width: "auto", display: "block" }} />;
  return <span className="logo-word">IGNITION <b>FITNESS</b></span>;
}

/* ================= APP ================= */
export default function App() {
  const { data: session, status } = useSession();
  const user = session?.user ?? null;
  const isAdmin = user?.role === "ADMIN";

  const [view, setView] = useState("home");
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Bookings and leads are admin-only reads now, so only fetch them once we
  // know the signed-in user is an admin — otherwise they'd just 401.
  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) { setBookings([]); setLeads([]); setLoaded(true); return; }
    (async () => {
      const [b, l] = await Promise.all([
        fetch("/api/bookings").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch("/api/leads").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);
      setBookings(b);
      setLeads(l);
      setLoaded(true);
    })();
  }, [isAdmin, status]);

  // The server owns the id, ref and capacity check, so the created booking is
  // returned to the caller rather than invented in the browser. Accepts either
  // the single-booking shape or { items: [...] } for the cart.
  const addBooking = async (input) => {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Could not complete that booking.");
    const made = Array.isArray(data) ? data : [data];
    if (isAdmin) setBookings((prev) => [...prev, ...made]);
    return data;
  };

  const updateBooking = async (id, patch) => {
    const before = bookings;
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("patch failed");
      const saved = await res.json();
      setBookings((bs) => bs.map((b) => (b.id === id ? saved : b)));
    } catch {
      setBookings(before); // roll the optimistic update back
    }
  };

  const addLead = async (email, source) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) return;
      const lead = await res.json();
      setLeads((prev) => (prev.some((l) => l.id === lead.id) ? prev : [...prev, lead]));
    } catch {
      /* lead capture is best-effort; never block the UI on it */
    }
  };

  const go = (v) => { setView(v); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="ign">
      <Theme />
      <Nav view={view} go={go} user={user} isAdmin={isAdmin} />
      {view === "home" && <Home go={go} addLead={addLead} />}
      {view === "book" && <Booking addBooking={addBooking} go={go} user={user} />}
      {view === "mine" && <MySessions go={go} user={user} status={status} />}
      {view === "admin" && <Admin bookings={bookings} updateBooking={updateBooking} leads={leads} loaded={loaded} user={user} isAdmin={isAdmin} status={status} />}
      {view !== "admin" && <Footer go={go} />}
    </div>
  );
}

/* ---------- nav ---------- */
function Nav({ view, go, user, isAdmin }) {
  return (
    <nav className="nav">
      <div className="wrap nav-in">
        <button className="logo" onClick={() => go("home")}>
          <Logo h={52} />
        </button>
        <div className="nav-links">
          <button className={"nlink" + (view === "home" ? " on" : "")} onClick={() => go("home")}>HOME</button>
          <button className="nlink" onClick={() => go("home")}>OUR STORY</button>
          <button className="nlink" onClick={() => go("home")}>PRICING</button>
          {user && (
            <button className={"nlink" + (view === "mine" ? " on" : "")} onClick={() => go("mine")}>MY SESSIONS</button>
          )}
          {isAdmin && (
            <button className={"nlink" + (view === "admin" ? " on" : "")} onClick={() => go("admin")}>ADMIN</button>
          )}
          {user
            ? <button className="nlink" onClick={() => signOut({ callbackUrl: "/" })}>SIGN OUT</button>
            : <a className="nlink" href="/login">SIGN IN</a>}
          <button className="btn btn-primary" onClick={() => go("book")} style={{ marginLeft: 8 }}>Book a Class</button>
        </div>
      </div>
    </nav>
  );
}

/* ---------- my sessions ---------- */
function MySessions({ go, user, status }) {
  const [data, setData] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch("/api/me/bookings")
      .then((r) => (r.ok ? r.json() : { upcoming: [], past: [] }))
      .then(setData)
      .catch(() => setData({ upcoming: [], past: [] }))
      .finally(() => setLoading(false));
  }, [user]);

  if (status === "loading") return <div className="page"><div className="wrap"><div className="empty">Loading…</div></div></div>;

  if (!user) {
    return (
      <div className="page"><div className="wrap"><div className="gate">
        <div className="glock"><Lock /></div>
        <h2>Sign In</h2>
        <p>Sign in to see the sessions you have booked.</p>
        <a className="btn btn-primary" style={{ width: "100%" }} href="/login?next=/">Sign In</a>
      </div></div></div>
    );
  }

  const Row = ({ b }) => (
    <div className="mysess">
      <div className="ms-when">
        <div className="ms-d">{CLASS_MAP[b.classType]?.label ?? b.classType}</div>
        <div className="ms-t">{fmtDate(b.date)} · {b.time} · {b.ref}</div>
      </div>
      <span className={"badge bg-" + b.status}>{b.status.replace("-", " ")}</span>
    </div>
  );

  return (
    <div className="page"><div className="wrap">
      <div className="page-head">
        <h1>My Sessions</h1>
        <p>Everything you have booked, {user.name?.split(" ")[0] ?? "athlete"}.</p>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-h"><h3>Upcoming</h3><span className="cnt">{data.upcoming.length}</span></div>
        {loading && <div className="empty">Loading…</div>}
        {!loading && data.upcoming.length === 0 && (
          <div className="empty">Nothing booked yet. <button className="linkish" onClick={() => go("book")}>Book a session</button></div>
        )}
        {data.upcoming.map((b) => <Row key={b.id} b={b} />)}
      </div>

      {data.past.length > 0 && (
        <div className="panel">
          <div className="panel-h"><h3>Past &amp; Cancelled</h3><span className="cnt">{data.past.length}</span></div>
          {data.past.map((b) => <Row key={b.id} b={b} />)}
        </div>
      )}
    </div></div>
  );
}

/* ---------- home ---------- */
function Home({ go, addLead }) {
  return (
    <>
      <header className="hero">
        <div className="hero-glow" /><div className="hero-glow2" />
        <div className="wrap hero-in">
          <img className="hero-logo reveal d1" src={LOGO_URL} alt="Ignition Fitness" />
          <div className="eyebrow reveal d2"><span className="dot" /> Kettlebell Training Specialists</div>
          <h1 className="hero-h reveal d3">Forge Your<br /><span className="lit">Strength</span><br /><span className="at">At Ignition Fitness</span></h1>
          <p className="hero-sub reveal d4">Small-group kettlebell training in Rancho Cucamonga. 15+ years of expert coaching, ten people max, and a whole lot of swing.</p>
          <div className="hero-cta reveal d4">
            <button className="btn btn-primary" onClick={() => go("book")}>Book Your First Class</button>
            <button className="btn btn-ghost" onClick={() => go("home")}>See Pricing</button>
          </div>
          <div className="stats reveal d5">
            {[["15+","Years Coaching"],["10","Max Class Size"],["RKC","Certified Since '08"],["100%","Commitment"]].map(([n,l]) => (
              <div className="stat" key={l}><div className="n">{n}</div><div className="l">{l}</div></div>
            ))}
          </div>
        </div>
      </header>

      <section className="section"><div className="wrap">
        <div className="kicker">One Tool · Infinite Possibilities</div>
        <h2 className="sh">One Bell.<br />Everything You Need.</h2>
        <div className="props">
          {["Strength + cardio in a single 60-minute session",
            "Burns more calories than traditional weight training",
            "Builds functional, real-world strength you actually use",
            "Low impact on joints, high impact on results",
            "Expert coaching every session, never guess again",
            "No machines, no confusion. Just you and the bell."].map((t) => (
            <div className="prop" key={t}><span className="ic"><Bell s={20} /></span><p>{t}</p></div>
          ))}
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="kicker">Why Kettlebells Win</div>
        <h2 className="sh">The Numbers Don't Lie</h2>
        <div className="three">
          {[["60","Minutes. That's It.","Strength, cardio, and mobility in one efficient session."],
            ["100%","Total Body","Glutes, core, shoulders, grip. Nothing gets left behind."],
            ["1","Tool. That's It.","No machines, no confusion. Just you and the bell."]].map(([n,t,p]) => (
            <div className="big" key={t}><div className="n">{n}</div><div className="t">{t}</div><p>{p}</p></div>
          ))}
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="kicker">Getting Started</div>
        <h2 className="sh">Three Steps To Ignition</h2>
        <p className="sh-sub">No experience needed. We meet you where you are.</p>
        <div className="steps">
          {[["01","Book A Class","Pick a time that works. Group classes are built for every level, and 1:1 training is there when you want it. Drop-ins always welcome."],
            ["02","Show Up","Small groups, max 10 people. Coach Mike guides every rep. You'll learn proper form from day one."],
            ["03","Get Strong","Feel the difference after one session. See it after four. Training that compounds. Every week you level up."]].map(([n,h,p]) => (
            <div className="step" key={n}><div className="num">{n}</div><h4>{h}</h4><p>{p}</p></div>
          ))}
        </div>
      </div></section>

      <LeadMagnet addLead={addLead} />

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="kicker">Flexible Options</div>
        <h2 className="sh">Invest In Yourself</h2>
        <p className="sh-sub">Drop-ins, memberships, and 1:1 packs. Your first class is just $25.</p>
        <div className="price-grid">
          <div className="pcard">
            <div className="pname">Drop-In</div>
            <div className="pamt">$25<span> /class</span></div>
            <div className="pdesc">Try us out. No commitment.</div>
            <ul><li><Check /> Any class on the schedule</li><li><Check /> Expert coaching included</li><li><Check /> Perfect for first-timers</li></ul>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => go("book")}>Book a Session</button>
          </div>
          <div className="pcard feat">
            <span className="pbadge">Best Value</span>
            <div className="pname">Biweekly</div>
            <div className="pamt">$75<span> /2 weeks</span></div>
            <div className="pdesc">Commit to your fitness. Save money.</div>
            <ul><li><Check /> Unlimited group classes</li><li><Check /> All class types included</li><li><Check /> Online booking</li></ul>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => go("book")}>Get Started</button>
          </div>
          <div className="pcard">
            <div className="pname">1:1 Training</div>
            <div className="pamt">$80<span> /session</span></div>
            <div className="pdesc">Your goals. Your pace. Packs from $65/session.</div>
            <ul><li><Check /> One-on-one attention</li><li><Check /> 8 sessions, save $80</li><li><Check /> 12 sessions, save $180</li></ul>
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => go("book")}>Book a Session</button>
          </div>
        </div>
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="band"><div className="hero-glow2" />
          <h2>Ready To Ignite?</h2>
          <p>Your first class is waiting. Show up, work hard, see what happens.</p>
          <button className="btn btn-ghost" onClick={() => go("book")}>Get Started Today</button>
        </div>
      </div></section>
    </>
  );
}

/* ---------- booking ---------- */
function Booking({ addBooking, go, user }) {
  const [step, setStep] = useState(1);
  const [classType, setClassType] = useState(null);
  const [date, setDate] = useState(null);
  const [cart, setCart] = useState([]); // [{ sessionId, date, time, classType }]
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [done, setDone] = useState(null); // array of created bookings
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  const days = useMemo(() => next14(), []);
  const cls = classType ? CLASS_MAP[classType] : null;

  // The schedule lives in the database. Blocked dates, cancelled sessions and
  // times that have already passed are filtered out server-side, and the
  // spots-left counts are authoritative.
  const reloadSlots = React.useCallback(async () => {
    try {
      const res = await fetch("/api/availability");
      setSlots(res.ok ? await res.json() : []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoaded(true);
    }
  }, []);

  useEffect(() => { reloadSlots(); }, [reloadSlots]);

  // Members book under their account; their details come from the session.
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: user.name || "", email: user.email || "" }));
  }, [user]);

  const slotsFor = (d) => slots.filter((s) => s.date === d && s.classType === classType);
  const dayHasSlots = (d) => slots.some((s) => s.date === d && s.classType === classType);

  const inCart = (sessionId) => cart.some((c) => c.sessionId === sessionId);
  const toggleSlot = (s) =>
    setCart((c) =>
      c.some((x) => x.sessionId === s.sessionId)
        ? c.filter((x) => x.sessionId !== s.sessionId)
        : [...c, { sessionId: s.sessionId, date: s.date, time: s.time, classType: s.classType }]
    );

  const cartSorted = [...cart].sort((a, b) =>
    a.date === b.date ? toMin(a.time) - toMin(b.time) : a.date.localeCompare(b.date)
  );
  const total = cart.reduce((n, c) => n + (CLASS_MAP[c.classType]?.price ?? 0), 0);

  const reset = () => {
    setDone(null); setStep(1); setClassType(null); setDate(null);
    setCart([]); setError(null);
    setForm({ name: user?.name || "", email: user?.email || "", phone: "" });
  };

  // The server assigns refs, enforces capacity and books the whole cart in one
  // transaction — all of it lands or none of it does.
  const confirm = async () => {
    if (saving || cart.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const created = await addBooking({
        items: cart.map((c) => ({ sessionId: c.sessionId })),
        contact: user
          ? { phone: form.phone.trim() }
          : { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
      });
      setDone(Array.isArray(created) ? created : [created]);
      setStep(5);
      reloadSlots();
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      reloadSlots(); // a slot may have filled or been blocked while they typed
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    const first = done[0];
    return (
      <div className="page"><div className="wrap"><div className="confirm">
        <div className="seal"><Check s={42} /></div>
        <h1>{done.length > 1 ? "You're All Booked" : "You're Booked"}</h1>
        <p style={{ color: "var(--ash)", fontSize: 16 }}>
          See you at the bell, {first.name.split(" ")[0]}. A confirmation is on its way to {first.email}.
        </p>
        <div className="ref">
          {done.length > 1 ? `${done.length} SESSIONS · ${done.map((b) => b.ref).join(" · ")}` : `CONFIRMATION · ${first.ref}`}
        </div>
        <div className="summary" style={{ marginTop: 24, textAlign: "left" }}>
          {done.map((b) => (
            <div className="srow" key={b.id}>
              <span className="k">{CLASS_MAP[b.classType]?.label ?? b.classType}</span>
              <span className="v">{fmtDate(b.date)} · {b.time}</span>
            </div>
          ))}
          <div className="srow"><span className="k">Location</span><span className="v">{STUDIO.addressLine}</span></div>
          <div className="srow total">
            <span className="k">Due at studio</span>
            <span className="v">${done.reduce((n, b) => n + (CLASS_MAP[b.classType]?.price ?? 0), 0)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={() => go("home")}>Back Home</button>
          {user && <button className="btn btn-ghost" onClick={() => go("mine")}>My Sessions</button>}
          <button className="btn btn-primary" onClick={reset}>Book Another</button>
        </div>
      </div></div></div>
    );
  }

  const contactOk = user
    ? true
    : form.name && /\S+@\S+\.\S+/.test(form.email) && form.phone.length >= 7;
  const canNext =
    (step === 1 && classType) || (step === 2 && cart.length > 0) || (step === 3 && contactOk);

  return (
    <div className="page"><div className="wrap">
      <div className="page-head">
        <h1>Book Your Spot</h1>
        <p>Pick your class, grab a time, and we'll see you at the studio.</p>
      </div>

      <div className="steps-bar">
        {[1, 2, 3, 4].map((n, i) => (
          <React.Fragment key={n}>
            <div className={"sbubble" + (step === n ? " on" : step > n ? " done" : "")}>{step > n ? <Check /> : n}</div>
            {i < 3 && <div className={"sline" + (step > n ? " on" : "")} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <>
            <SLabel>Choose your training</SLabel>
            <div className="opt-grid">
              {CLASSES.map((c) => (
                <button key={c.id} className={"opt" + (classType === c.id ? " sel" : "")} onClick={() => setClassType(c.id)}>
                  <span className="oicon">{c.id === "pt" ? <User s={22} /> : <Bell s={22} />}</span>
                  <span><span className="otitle">{c.label}</span><span className="otag">{c.tag}</span><span className="odesc">{c.desc}</span></span>
                  <span className="oprice">${c.price}<small>{c.id === "pt" ? "per session" : "drop-in"}</small></span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <SLabel>Pick your dates</SLabel>
            <div className="date-row">
              {days.map((d) => {
                const k = iso(d); const open = dayHasSlots(k);
                return (
                  <button key={k} disabled={!open} className={"datechip" + (date === k ? " sel" : "")}
                    onClick={() => setDate(k)} style={!open ? { opacity: .3, cursor: "not-allowed" } : {}}>
                    <div className="dow">{DOW[d.getUTCDay()]}</div>
                    <div className="dnum">{d.getUTCDate()}</div>
                    <div className="dmo">{MON[d.getUTCMonth()]}</div>
                  </button>
                );
              })}
            </div>
            {!slotsLoaded && <div className="empty-day">Loading the schedule…</div>}
            {slotsLoaded && date ? (
              <>
                <SLabel>Tap every time you want</SLabel>
                <div className="slot-grid">
                  {slotsFor(date).map((s) => {
                    const left = s.spotsLeft;
                    const picked = inCart(s.sessionId);
                    const cl = left === 0 ? "spots-none" : left <= 3 ? "spots-low" : "spots-ok";
                    return (
                      <button key={s.sessionId} disabled={left === 0 && !picked}
                        className={"slot" + (picked ? " picked" : "")} onClick={() => toggleSlot(s)}>
                        <div className="stime">{s.time}</div>
                        <div className="stype">{(cls || CLASS_MAP[s.classType]).label}</div>
                        <div className={"sspots " + cl}>
                          {picked ? "Added ✓" : left === 0 ? "Full" : left + (left === 1 ? " spot left" : " spots left")}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {slotsFor(date).length === 0 && <div className="empty-day">No open times left on this date.</div>}
              </>
            ) : slotsLoaded ? (
              <div className="empty-day">Select a date to see open class times.</div>
            ) : null}

            {cart.length > 0 && (
              <div className="cart-bar">
                <span className="cn">{cart.length}</span>
                <span className="cl">
                  {cart.length === 1 ? "session selected" : "sessions selected"} · ${total} due at studio
                  <br />Pick more dates above, or continue.
                </span>
                <button className="btn btn-ghost" onClick={() => setCart([])}>Clear</button>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <SLabel>Your details</SLabel>
            {user ? (
              <>
                <div className="summary" style={{ marginBottom: 18 }}>
                  <div className="srow"><span className="k">Booking as</span><span className="v">{user.name}</span></div>
                  <div className="srow"><span className="k">Email</span><span className="v">{user.email}</span></div>
                </div>
                <div className="field"><label>Phone (optional)</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(909) 555-0123" /></div>
              </>
            ) : (
              <>
                <div className="field"><label>Full name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
                <div className="field"><label>Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@email.com" /></div>
                <div className="field"><label>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(909) 555-0123" /></div>
                <p style={{ color: "var(--ash)", fontSize: 13, fontFamily: "var(--mono)", textAlign: "center" }}>
                  Booking as a guest. <a href="/signup" style={{ color: "var(--ember2)" }}>Create an account</a> to track your sessions.
                </p>
              </>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <SLabel>Review &amp; confirm</SLabel>
            <div className="cart-list">
              {cartSorted.map((c) => (
                <div className="cart-item" key={c.sessionId}>
                  <span className="ci-when">{fmtDate(c.date)} · {c.time}</span>
                  <span className="ci-type">{CLASS_MAP[c.classType]?.label ?? c.classType}</span>
                </div>
              ))}
            </div>
            <div className="summary">
              <div className="srow"><span className="k">Name</span><span className="v">{user ? user.name : form.name}</span></div>
              <div className="srow"><span className="k">Contact</span><span className="v">{user ? user.email : form.email}</span></div>
              <div className="srow"><span className="k">Sessions</span><span className="v">{cart.length}</span></div>
              <div className="srow total"><span className="k">Due at studio</span><span className="v">${total}</span></div>
            </div>
            <p style={{ color: "var(--ash)", fontSize: 13, fontFamily: "var(--mono)", textAlign: "center" }}>Payment handled in person. Cancel free up to 12 hours before.</p>
            {error && (
              <p style={{ color: "var(--flame)", fontSize: 13, fontFamily: "var(--mono)", textAlign: "center", marginTop: 12 }}>{error}</p>
            )}
          </>
        )}
      </div>

      <div className="nav-btns">
        <button className="btn btn-ghost" onClick={() => step === 1 ? go("home") : setStep(step - 1)}>{step === 1 ? "Cancel" : "Back"}</button>
        {step < 4
          ? <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue <Arrow /></button>
          : <button className="btn btn-primary" disabled={saving} onClick={confirm}>{saving ? "Booking…" : <>Confirm {cart.length > 1 ? `${cart.length} Sessions` : "Booking"} <Check /></>}</button>}
      </div>
    </div></div>
  );
}
const SLabel = ({ children }) => (<div style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: ".14em", color: "var(--ember2)", textTransform: "uppercase", marginBottom: 18, fontWeight: 600 }}>{children}</div>);
// Parsed and read in UTC so a "YYYY-MM-DD" always renders as that same day,
// regardless of the viewer's own timezone.
function fmtDate(d) { const x = new Date(d + "T00:00:00.000Z"); return `${DOW[x.getUTCDay()]}, ${MON[x.getUTCMonth()]} ${x.getUTCDate()}`; }

/* ---------- admin ---------- */
function Admin({ bookings, updateBooking, leads, loaded, user, isAdmin, status }) {
  const [tab, setTab] = useState("calendar");
  const [fStatus, setFStatus] = useState("all");
  const [fWhen, setFWhen] = useState("upcoming");
  const [todaySlots, setTodaySlots] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [blockForm, setBlockForm] = useState({ date: "", allDay: true, startTime: "06:00", endTime: "12:00", reason: "" });
  const [blockBusy, setBlockBusy] = useState(false);
  const [blockError, setBlockError] = useState(null);

  // "Today" must be the studio's day, not the server's UTC day — after 5pm
  // Pacific those differ and the dashboard would jump to tomorrow.
  const today = studioNow().isoDay;
  // Derived from the studio's day, not the viewer's, so the filters agree with `today`.
  const weekEnd = iso(new Date(Date.parse(`${today}T00:00:00.000Z`) + 7 * 86400000));

  const loadSchedule = React.useCallback(async () => {
    const [s, b] = await Promise.all([
      fetch(`/api/availability?from=${today}&to=${today}&includePast=true`)
        .then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch(`/api/admin/blocks?from=${today}`)
        .then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]);
    setTodaySlots(s);
    setBlocks(b);
  }, [today]);

  useEffect(() => { if (isAdmin) loadSchedule(); }, [isAdmin, loadSchedule, bookings]);

  const addBlock = async () => {
    if (!blockForm.date || blockBusy) return;
    setBlockBusy(true);
    setBlockError(null);
    try {
      const res = await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blockForm),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Could not save that block.");
      setBlockForm({ date: "", allDay: true, startTime: "06:00", endTime: "12:00", reason: "" });
      await loadSchedule();
    } catch (e) {
      setBlockError(e.message);
    } finally {
      setBlockBusy(false);
    }
  };

  const removeBlock = async (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    try {
      await fetch(`/api/admin/blocks/${id}`, { method: "DELETE" });
    } finally {
      await loadSchedule();
    }
  };

  if (status === "loading") {
    return <div className="adm"><div className="wrap"><div className="empty">Checking your session…</div></div></div>;
  }

  // Real authorisation now: the server rejects these endpoints for anyone
  // without an ADMIN role, so this is just the matching UI.
  if (!isAdmin) {
    return (
      <div className="adm"><div className="wrap"><div className="gate">
        <div className="glock"><Lock /></div>
        <h2>Coach Login</h2>
        <p>
          {user
            ? "This dashboard is for Ignition staff. Your account doesn't have coach access."
            : "This dashboard is for Ignition staff. Sign in with your coach account to manage bookings."}
        </p>
        {user
          ? <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
          : <a className="btn btn-primary" style={{ width: "100%" }} href="/login?next=/">Sign In</a>}
      </div></div></div>
    );
  }

  const filtered = bookings
    .filter((b) => fStatus === "all" ? true : b.status === fStatus)
    .filter((b) => {
      if (fWhen === "today") return b.date === today;
      if (fWhen === "week") return b.date >= today && b.date <= weekEnd;
      if (fWhen === "upcoming") return b.date >= today;
      return true;
    })
    .sort((a, b) => a.date === b.date ? toMin(a.time) - toMin(b.time) : a.date.localeCompare(b.date));

  const active = bookings.filter((b) => b.status !== "cancelled");
  const todays = active.filter((b) => b.date === today);
  const upcoming = active.filter((b) => b.date >= today);
  const weekCount = active.filter((b) => b.date >= today && b.date <= weekEnd).length;
  // Capacity comes from the actual sessions on the schedule rather than a
  // guessed constant, so the utilisation bar reflects real seats.
  const seatsToday = todaySlots.reduce((n, s) => n + s.capacity, 0);
  const totalCap = seatsToday ? Math.round((todays.length / seatsToday) * 100) : 0;

  return (
    <div className="adm"><div className="wrap">
      <div className="adm-top">
        <h1>Bookings Dashboard<small>IGNITION FITNESS · COACH MIKE</small></h1>
        <button className="btn btn-ghost" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="kn">{todays.length}</div><div className="kl">Booked Today</div>
          <div className="kbar"><i style={{ width: Math.min(100, totalCap) + "%" }} /></div></div>
        <div className="kpi"><div className="kn">{upcoming.length}</div><div className="kl">Upcoming Total</div></div>
        <div className="kpi"><div className="kn">{weekCount}</div><div className="kl">Next 7 Days</div></div>
        <div className="kpi"><div className="kn">{active.filter((b) => b.status === "pending").length}</div><div className="kl">Awaiting Confirm</div></div>
      </div>

      <div className="filters" style={{ marginBottom: 18 }}>
        {[["calendar", "Calendar"], ["list", "Bookings List"]].map(([k, l]) => (
          <button key={k} className={"fbtn" + (tab === k ? " on" : "")} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "calendar" && (
        <div style={{ marginBottom: 18 }}>
          <AdminCalendar updateBooking={updateBooking} refreshKey={bookings.length} />
        </div>
      )}

      <div className="adm-grid" style={tab === "calendar" ? { gridTemplateColumns: "1fr" } : undefined}>
        {tab === "list" && (
        <div className="panel">
          <div className="panel-h"><h3>Bookings</h3><span className="cnt">{filtered.length} shown</span></div>
          <div className="filters" style={{ padding: "14px 22px 4px" }}>
            {[["upcoming","Upcoming"],["today","Today"],["week","This Week"],["all","All Time"]].map(([k, l]) => (
              <button key={k} className={"fbtn" + (fWhen === k ? " on" : "")} onClick={() => setFWhen(k)}>{l}</button>
            ))}
          </div>
          <div className="filters" style={{ padding: "0 22px 12px" }}>
            {[["all","Any"],["confirmed","Confirmed"],["pending","Pending"],["checked-in","Checked-in"],["cancelled","Cancelled"]].map(([k, l]) => (
              <button key={k} className={"fbtn" + (fStatus === k ? " on" : "")} onClick={() => setFStatus(k)}>{l}</button>
            ))}
          </div>
          <div>
            {filtered.length === 0 && <div className="empty">No bookings match this filter.</div>}
            {filtered.map((b) => (
              <div className="book-row" key={b.id}>
                <div className="avatar">{b.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
                <div className="bmeta">
                  <div className="bn">{b.name}</div>
                  <div className="bd">{CLASS_MAP[b.classType].label} · {fmtDate(b.date)} · {b.time} · {b.ref}</div>
                </div>
                <span className={"badge bg-" + b.status}>{b.status.replace("-", " ")}</span>
                <div className="row-acts">
                  {b.status !== "checked-in" && b.status !== "cancelled" && (
                    <button className="iact go" title="Check in" onClick={() => updateBooking(b.id, { status: "checked-in" })}><Check /></button>
                  )}
                  {b.status === "pending" && (
                    <button className="iact ok" title="Confirm" onClick={() => updateBooking(b.id, { status: "confirmed" })}><Bell s={14} /></button>
                  )}
                  {b.status !== "cancelled" && (
                    <button className="iact no" title="Cancel" onClick={() => updateBooking(b.id, { status: "cancelled" })}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {tab === "list" && (
        <div className="panel">
          <div className="panel-h"><h3>Today's Schedule</h3><span className="cnt">{fmtDate(today)}</span></div>
          {todaySlots.length === 0 && <div className="empty">No classes scheduled today.</div>}
          {todaySlots.map((s) => {
            const pct = Math.round((s.booked / s.capacity) * 100);
            const col = pct >= 100 ? "var(--flame)" : pct >= 70 ? "var(--gold)" : "var(--ember)";
            return (
              <div className="sched-row" key={s.sessionId}>
                <div className="sched-time">{s.time}</div>
                <div className="sched-info">
                  <div className="st">{CLASS_MAP[s.classType].label}</div>
                  <div className="capbar"><i style={{ width: Math.min(100, pct) + "%", background: col }} /></div>
                </div>
                <div className="sched-cnt" style={{ color: col }}>{s.booked}/{s.capacity}</div>
              </div>
            );
          })}
        </div>
        )}

        <div className="panel">
          <div className="panel-h"><h3>Availability</h3><span className="cnt">{blocks.length} blocked</span></div>
          <div style={{ padding: "14px 22px 18px" }}>
            <p style={{ color: "var(--ash)", fontSize: 12.5, fontFamily: "var(--mono)", marginBottom: 14, lineHeight: 1.6 }}>
              Close the studio for a date or a stretch of hours. Blocked times vanish from booking straight away.
            </p>
            <div className="blk-form">
              <input type="date" min={today} value={blockForm.date}
                onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })} />
              <div className="blk-modes">
                <button className={"fbtn" + (blockForm.allDay ? " on" : "")}
                  onClick={() => setBlockForm({ ...blockForm, allDay: true })}>All day</button>
                <button className={"fbtn" + (!blockForm.allDay ? " on" : "")}
                  onClick={() => setBlockForm({ ...blockForm, allDay: false })}>Hours</button>
              </div>
              {!blockForm.allDay && (
                <div className="blk-times">
                  <input type="time" value={blockForm.startTime}
                    onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })} />
                  <span>to</span>
                  <input type="time" value={blockForm.endTime}
                    onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })} />
                </div>
              )}
              <input placeholder="Reason (optional)" value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} />
              <button className="btn btn-primary" style={{ width: "100%" }}
                disabled={!blockForm.date || blockBusy} onClick={addBlock}>
                {blockBusy ? "Saving…" : "Block This Time"}
              </button>
              {blockError && <div className="blk-err">{blockError}</div>}
            </div>
          </div>
          {blocks.length === 0 && <div className="empty">Nothing blocked. The full schedule is open.</div>}
          {blocks.map((b) => (
            <div className="lead-row" key={b.id}>
              <div className="le">
                {fmtDate(b.date)}
                <span style={{ color: "var(--ash)", fontFamily: "var(--mono)", fontSize: 11.5, marginLeft: 8 }}>
                  {b.allDay ? "all day" : `${to12h(b.startTime)} – ${to12h(b.endTime)}`}
                </span>
              </div>
              {b.reason && <span className="lsrc">{b.reason}</span>}
              <button className="iact no" title="Remove block" onClick={() => removeBlock(b.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-h"><h3>Leads</h3><span className="cnt">{leads.length} captured</span></div>
          {leads.length === 0 && <div className="empty">No leads yet. The free-guide form feeds this list.</div>}
          {[...leads].sort((a, b) => b.createdAt - a.createdAt).map((l) => (
            <div className="lead-row" key={l.id}>
              <div className="le">{l.email}</div>
              <span className="lsrc">{l.source}</span>
              <span className="ld">{relTime(l.createdAt)}</span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div></div>
  );
}

/* ---------- lead magnet ---------- */
function LeadMagnet({ addLead }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email);
  const submit = () => { if (!valid) return; addLead(email.trim(), "kb-basics"); setDone(true); };
  return (
    <section className="section" style={{ paddingTop: 0 }}><div className="wrap">
      <div className="lead"><div className="lead-glow" />
        <div>
          <div className="kicker">Free Download</div>
          <h2>The Kettlebell<br />Basics Guide</h2>
          <p className="lp">New to the bell? This free guide covers everything you need before your first swing. No fluff, just the fundamentals that keep you safe and strong.</p>
          <ul>
            <li><Check /> The 6 foundational movements, step by step</li>
            <li><Check /> How to breathe, brace, and protect your back</li>
            <li><Check /> A beginner workout you can do anywhere</li>
            <li><Check /> The 5 most common mistakes, and the fixes</li>
          </ul>
        </div>
        <div className="lead-form">
          {done ? (
            <div className="lead-done">
              <div className="lc"><Check s={30} /></div>
              <h4>Check Your Inbox</h4>
              <p>Your Kettlebell Basics guide is on its way to {email}. See you at the studio.</p>
            </div>
          ) : (
            <>
              <div className="ttl">Get It Free</div>
              <div className="sub">Drop your email and we'll send the PDF straight over.</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
                onKeyDown={(e) => e.key === "Enter" && submit()} />
              <button className="btn btn-primary" style={{ width: "100%" }} disabled={!valid} onClick={submit}>Send Me The Guide</button>
              <div className="privacy">No spam, ever. Unsubscribe anytime.</div>
            </>
          )}
        </div>
      </div>
    </div></section>
  );
}

/* ---------- footer ---------- */
function Footer({ go }) {
  return (
    <footer className="foot"><div className="wrap">
      <div className="foot-grid">
        <div>
          <button className="logo" onClick={() => go("home")} style={{ marginBottom: 18 }}>
            <Logo h={62} />
          </button>
          <p style={{ maxWidth: "34ch" }}>Forging strength, one swing at a time. Small-group kettlebell training in Rancho Cucamonga.</p>
        </div>
        <div><h5>Navigate</h5>
          <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Home</a>
          <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Our Story</a>
          <a onClick={() => go("home")} style={{ cursor: "pointer" }}>Pricing</a>
          <a onClick={() => go("book")} style={{ cursor: "pointer" }}>Book a Class</a>
        </div>
        <div><h5>Contact</h5>
          <a href="mailto:mike@ignitionfitness.com">mike@ignitionfitness.com</a>
          <a href="tel:9099214463">(909) 921-4463</a>
          <p>9125 Archibald Ave, Ste D<br />Rancho Cucamonga, CA 91730</p>
        </div>
      </div>
      <div className="foot-bottom"><span>© 2026 Ignition Fitness</span><span>FORGE · SWING · REPEAT</span></div>
    </div></footer>
  );
}
