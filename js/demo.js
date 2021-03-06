$(document).ready( function() {

	// Set cart key if it does not exist.
	if ( ! window.localStorage.getItem( 'cocart_cart_key' ) ) {
		window.localStorage.setItem( 'cocart_cart_key', 'demo' );
	}

	// Set localStorage to store response status if it does not exist.
	if ( window.localStorage.getItem('cocart_demo_response') == undefined ) {
		window.localStorage.setItem('cocart_demo_response', 'closed');
	} else {
		$show_api_response = window.localStorage.getItem('cocart_demo_response');
		if ( $show_api_response == 'opened' ) {
			$('a.toggle-results').text('Hide response');
			$('.api-request').removeClass('closed').addClass('opened');
		} else {
			$('a.toggle-results').text('Show response');
			$('.api-request').addClass('closed').removeClass('opened');
		}
	}

	var site_url    = "https://wp-demo.cocart.xyz",
		version     = "cocart/v1/",
		page_number = 1,
		per_page    = 8,
		order_by    = 'menu_order',
		order       = 'asc',
		debug_mode  = true,
		return_cart = true;

	/* Show API requests if debug mode is set to true. */
	if ( debug_mode ) {
		$( '.api-request' ).css( 'opacity', 1 );
		return_cart = false;
	}

	get_cart('closed'); // Load cart but don't open it.

	load_products( per_page, page_number, order_by, order ); // Load the first 6 products.

	$('.product-grid').after('<a class="load-more button button--primary w100 href="#">Load More Products</a>');

	// Cart
	$('a.cart').on( 'click', function(e) {
		e.preventDefault();
		get_cart('open');
	});

	// Load more products
	$('a.load-more').on( 'click', function(e) {
		e.preventDefault();
		$(this).text( 'Loading' ).addClass('loading').prop('disabled', true);
		load_products( per_page, page_number, order_by, order ); // Load the next 6 products.
	});

	// Loads products
	function load_products( $per_page, $page_number, $order_by, $order ) {
		var method   = 'GET',
			endpoint = "products?per_page=" + $per_page + "&page=" + $page_number + "&orderby=" + $order_by + "&order=" + $order,
			posts = restjQuery({
			site_url: site_url,
			namespace: version,
			formMethod: method,
			endpoint: endpoint
		});

		// Check if data returned before listing posts.
		if ( posts !== undefined && posts.length > 0 ) {
			if ( page_number == 1 ) {
				$(".app").html('<div class="results"><ul class="product-grid d-grid"></ul></div>');
			}

			var template = {};

			$.each(posts, function(key, value) {
				template[value] = '<li id="product-' + value['id'] + '" class="entry">' +
					'<div class="card">' +
						'<div class="card__header">' +
							'<a class="d-block" target="_blank">' +
								'<div class="image image--product-card"></div>' +
							'</a>' +
							'<div class="card__cta">' +
								'<button class="card__button button button--primary w100" type="button">Add to Cart</button>' +
							'</div>' +
						'</div>' +
						'<div class="card__body">' +
							'<h3 class="card__title">' +
								'<a class="card__link"></a>' +
							'</h3>' +
							'<div class="card__byline"></div>' +
							'<div class="card__price-and-labels">' +
								'<div class="card__price">' +
									'<span></span>' +
								'</div>' +
							'</div>' +
						'</div>' +
					'</div>' +
				'</li>';

				$(".product-grid").append( template[value] ).promise().done( function() {
					var product = $('li#product-' + value['id']);

					$( product ).find("a").attr( "href", value["permalink"] );
					$( product ).find("div.image").html('<img src="' + value['images'][0]['src']['shop_catalog'] + '" />');
					$( product ).find("h3.card__title a").html( value["name"] );
					$( product ).find("div.card__byline").html( value["short_description"] );
					$( product ).find("div.card__price span").html( value["price"] );
					$( product ).find("button").addClass( 'product-' + value["type"] );

					// Adds product data to button.
					$.each( value, function( key, attribute ) {
						if ( typeof attribute === 'string' || typeof attribute === 'boolean' || typeof attribute === 'number' ) {
							if ( key != 'yoast_head' ) {
								$( product ).find("button").attr('data-' + key, attribute );
							}
						}
					});

					// Button text overrides
					if ( value["type"] == 'variable' ) {
						$( product ).find("button").text( "Select Option" );
					}

					// Overrides button text if set for an external product.
					var button_text = value["button_text"];
					if ( typeof button_text !== 'undefined' && button_text != '' && value["type"] == 'external' ) {
						$( product ).find("button").text( button_text );
					}

				});
			});

			page_number = page_number+1;

			$('a.load-more').text( 'Load More Products' ).removeClass( 'loading' ).prop('disabled', false);

			// Return response results if debug mode is enabled.
			if ( debug_mode ) {
				$('.api-request label.method').text(method).addClass(method.toLowerCase());
				$('.api-request span.endpoint').text(site_url + '/' + version + endpoint);
				$('.api-request code.results').html( syntaxHighlight( JSON.stringify( posts, undefined, 4 ) ) );
			}
		}
		else {
			$('a.load-more').text( 'No more products!' ).removeClass( 'loading' ).fadeOut('slow', function() {
				$(this).remove();
			});
		}
	} // END load_products()

	// Add to cart button
	$(document).on( 'click', '.card__button', function() {
		console.log( "Your trying to add " + $(this).attr( 'data-name' ) + " to the cart." );

		var qty = 1;
		var variation_id = '';
		var variation = '';

		if ( ! $(this).hasClass('product-variable') ) {
			var product_id = $(this).attr( 'data-id' );

			$(this).text( 'Adding to cart' ).addClass('loading').prop('disabled', true);
			add_to_cart( product_id, qty, variation_id, variation, this );
		} else {
			alert( "Modal will open for selections soon." );
		}
	});

	// Get cart
	function get_cart( $open ) {
		if ( $open == 'open' ) {
			alert( 'Cart will show soon!' );
			return;
		}

		$cart_key = window.localStorage.getItem('cocart_cart_key');

		var method   = 'GET',
			endpoint = "get-cart?cart_key=" + $cart_key;

		var cart = restjQuery({
			site_url: site_url,
			namespace: version,
			endpoint: endpoint,
			formMethod: method,
		});

		var cart_count = $('div.cart__item-count');

		$.each(cart, function(key, value) {
		});

		// Update counter
		$('div.cart__item-count span').html();

		// Show cart counter.
		if ( $('div.cart__item-count span').text().length > 0 ) {
			$(cart_count).removeClass('is-empty');
		}

		// Return response results if debug mode is enabled.
		if ( debug_mode ) {
			$('.api-request label.method').text(method).addClass(method.toLowerCase());
			$('.api-request span.endpoint').text(site_url + '/' + version + endpoint);
			$('.api-request code.results').html( syntaxHighlight( JSON.stringify( cart, undefined, 4 ) ) );
		}
	}

	// Add item to the cart.
	function add_to_cart( product_id, qty, variation_id, variation, button ) {
		$cart_key = window.localStorage.getItem('cocart_cart_key');

		if ( variation.length > 0 ) {
			var method   = 'POST',
				endpoint = "add-item?cart_key=" + $cart_key,
				data     = {
				"product_id": product_id,
				"quantity": qty,
				"variation_id": variation_id,
				"variation": variation,
				"return_cart": return_cart
			};
		} else {
			var method   = 'POST',
				endpoint = "add-item?cart_key=" + $cart_key,
				data     = {
				"product_id": product_id,
				"quantity": qty,
				"return_cart": return_cart
			};
		}

		var item = restjQuery({
			site_url: site_url,
			namespace: version,
			endpoint: endpoint,
			formMethod: method,
			postData: JSON.stringify( data )
		});

		var cart    = $('div.cart__item-count');
		var counter = $('div.cart__item-count span');

		// Update counter
		var current_counter = +( $(counter).text() );
		var new_counter = current_counter + qty;
		$('div.cart__item-count span').html(new_counter);

		// Show cart counter.
		$(cart).removeClass('is-empty');
		
		$(cart).addClass('animated heartBeat fast').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
			$(this).removeClass('animated heartBeat fast');
		});

		$(button).text( 'Add to cart' ).removeClass( 'loading' ).prop('disabled', false);

		// Return response results if debug mode is enabled.
		if ( debug_mode ) {
			$('.api-request label.method').text(method).addClass(method.toLowerCase());
			$('.api-request span.endpoint').text(site_url + '/' + version + endpoint);
			$('.api-request code.results').html( syntaxHighlight( JSON.stringify( item, undefined, 4 ) ) );
		}
	} // add_to_cart()

	$('a.toggle-results').on( 'click', function() {
		$(this).text('Hide response');

		if ( $('.api-request').hasClass('closed') ) {
			$(this).text('Hide response');
			$('.api-request').removeClass('closed').addClass('opened');
			window.localStorage.setItem('cocart_demo_response', 'opened');
		} else {
			$(this).text('Show response');
			$('.api-request').addClass('closed').removeClass('opened');
			window.localStorage.setItem('cocart_demo_response', 'closed');
		}

		return false;
	});

	function syntaxHighlight( json ) {
		json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

		return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {

			var cls = 'number';

			if (/^"/.test(match) ) {
				if (/:$/.test(match) ) {
					cls = 'key';
				} else {
					cls = 'string';
				}
			} else if (/true|false/.test(match)) {
				cls = 'boolean';
			} else if (/null/.test(match)) {
				cls = 'null';
			}

			return '<span class="' + cls + '">' + match + '</span>';
		});
	}

	function animateCSS(element, animationName, callback) {
		const node = document.querySelector(element)
		node.classList.add('animated', animationName)
	
		function handleAnimationEnd() {
			node.classList.remove('animated', animationName)
			node.removeEventListener('animationend', handleAnimationEnd)
	
			if (typeof callback === 'function') callback()
		}
	
		node.addEventListener('animationend', handleAnimationEnd)
	}

});
