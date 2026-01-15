import product1 from '../assets/product_1.png';
import product2 from '../assets/product_2.png';
import product3 from '../assets/product_3.png';
import product4 from '../assets/product_4.png';

export const products = [
    {
        id: 1,
        title: "Classic Wayfarer",
        price: 129.99,
        category: "Men",
        style: "Wayfarer",
        image: product1,
        isNew: false
    },
    {
        id: 2,
        title: "Luxury Aviator",
        price: 249.99,
        category: "Unisex",
        style: "Aviator",
        image: product2,
        isNew: true
    },
    {
        id: 3,
        title: "Clubmaster Elite",
        price: 189.99,
        category: "Women",
        style: "Clubmaster",
        image: product3,
        isNew: true
    },
    {
        id: 4,
        title: "Sport Performance",
        price: 159.99,
        category: "Men",
        style: "Sport",
        image: product4,
        isNew: false
    },
    {
        id: 5,
        title: "Modern Round",
        price: 119.99,
        category: "Women",
        style: "Round",
        image: product3, // Reusing mock image
        isNew: false
    },
    {
        id: 6,
        title: "Golden Hour",
        price: 299.99,
        category: "Unisex",
        style: "Aviator",
        image: product2, // Reusing mock image
        isNew: true
    },
    {
        id: 7,
        title: "Urban Shield",
        price: 149.99,
        category: "Men",
        style: "Shield",
        image: product4, // Reusing mock image
        isNew: false
    },
    {
        id: 8,
        title: "Minimal Square",
        price: 139.99,
        category: "Unisex",
        style: "Square",
        image: product1, // Reusing mock image
        isNew: false
    }
];
