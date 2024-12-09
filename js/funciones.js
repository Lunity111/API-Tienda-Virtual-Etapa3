const app = Vue.createApp({
    data() {
        return {
            countries: [], // Lista de países
            selectedCountry: 'Mexican', // País seleccionado inicialmente
            meals: [], // Lista completa de platillos
            searchQuery: '', // Barra de búsqueda
            selectedRating: 1, // Calificación mínima seleccionada
            cart: JSON.parse(localStorage.getItem('cart')) || [] // Cargar carrito desde localStorage
        };
    },
    mounted() {
        this.loadCountries(); // Cargar países al iniciar
        const storedMeals = localStorage.getItem('meals');
        if (storedMeals) {
            this.meals = JSON.parse(storedMeals);
        } else {   
            this.loadMealsByCountry(); // Cargar platillos de México al iniciar
        }
        
    },
    computed: {
        // Filtrar platillos según la búsqueda y calificación
        filteredMeals() {
            const query = this.searchQuery.toLowerCase(); // Convertir a minúsculas
            return this.meals.filter(meal =>
                meal.strMeal.toLowerCase().includes(query) && meal.rating >= this.selectedRating
            );
        },
        // Calcular el porcentaje de progreso
        progressPercentage() {
            return (this.filteredMeals.length / this.meals.length) * 100 || 0;
        },
        visibleMeals() {
            const query = this.searchQuery.toLowerCase();
            return this.meals.filter(meal =>
                meal.strArea === this.selectedCountry && // Filtrar por país
                meal.strMeal.toLowerCase().includes(query) && // Filtrar por nombre
                meal.rating >= this.selectedRating // Filtrar por calificación mínima
            );
        },
        // Calcular el total de artículos en el carrito
        totalItems() {
            return this.cart.reduce((total, item) => total + item.quantity, 0);
        },
    
    },
    methods: {
        // Cargar países
        loadCountries() {
            axios.get('https://www.themealdb.com/api/json/v1/1/list.php?a=list')
                .then(response => {
                    this.countries = response.data.meals;
                })
                .catch(error => {
                    console.error("Error al cargar países:", error);
                });
        },
        // Cargar platillos típicos del país seleccionado con detalles adicionales
        loadMealsByCountry() {
            if (!this.selectedCountry) {
                console.warn("No se ha seleccionado ningún país.");
                return;
            }
        
            axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${this.selectedCountry}`)
                .then(response => {
                    const basicMeals = response.data.meals;
        
                    // Detallar cada platillo
                    const detailedMealsPromises = basicMeals.map(meal =>
                        axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
                            .then(res => {
                                const mealDetails = res.data.meals[0];
                                mealDetails.price = this.generateRandomPrice(); // Precio aleatorio
                                mealDetails.rating = this.generateRandomRating(); // Calificación aleatoria
                                return mealDetails;
                            })
                    );
        
                    Promise.all(detailedMealsPromises).then(detailedMeals => {
                        // Leer los platillos existentes del localStorage
                        const storedMeals = JSON.parse(localStorage.getItem('meals')) || [];
        
                        // Combinar los platillos nuevos con los existentes, evitando duplicados
                        const updatedMeals = [...storedMeals, ...detailedMeals].reduce((unique, meal) => {
                            if (!unique.some(existingMeal => existingMeal.idMeal === meal.idMeal)) {
                                unique.push(meal);
                            }
                            return unique;
                        }, []);
        
                        // Guardar la lista actualizada en el localStorage
                        localStorage.setItem('meals', JSON.stringify(updatedMeals));
        
                        // Actualizar el estado de Vue
                        this.meals = updatedMeals;
                    });
                })
                .catch(error => {
                    console.error("Error al cargar platillos:", error);
                });
        },    
        // Generar un precio aleatorio entre $50 y $250
        generateRandomPrice() {
            return Math.floor(Math.random()*(250-50)+50); // $50 a $250
        },
        // Generar una calificación aleatoria entre 1 y 5
        generateRandomRating() {
            return Math.floor(Math.random()*5) + 1; // 1 a 5 estrellas
        },
        // Generar HTML para las estrellas
        generateStars(rating) {
            return '★'.repeat(rating) + '☆'.repeat(5 - rating); // Rellenar estrellas
        },
        //Generar Ventana de Detalles con local storage
        viewDetails(meal) {
            localStorage.setItem('selectedMeal', JSON.stringify(meal));
            window.location.href = 'detalle.html';
        },
        // Navegar a la página de carrito
        goToCart() {
            window.location.href = 'carrito.html';
        },
        //Agregar al carrito
        addToCart(meal) {
            const itemInCart = this.cart.find(item => item.idMeal === meal.idMeal);
            if (itemInCart) {
                itemInCart.quantity++;
            } else {
                this.cart.push({
                    idMeal: meal.idMeal,
                    name: meal.strMeal,
                    image: meal.strMealThumb,
                    price: Math.round(Math.random() * 500) + 100,
                    quantity: 1
                });
            }
        },
        
    },
    watch: {
        // Mantener sincronizado el carrito con el localStorage
        cart: {
            handler(newCart) {
                localStorage.setItem('cart', JSON.stringify(newCart));
            },
            deep: true
        }
    },
});

app.mount("#contenedor");

//Evento storage 
window.addEventListener('storage', (event) => {
    if (event.key === 'meals') {
        const storedMeals = JSON.parse(event.newValue);
        if (storedMeals) {
            app.meals = storedMeals;
        }
    }
});



