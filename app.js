(() => {
    "use strict";

    const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const elements = {
        brand: document.querySelector("#brand-name"),
        storeStatus: document.querySelector("#store-status"),
        deliveryTime: document.querySelector("#delivery-time"),
        categoryList: document.querySelector("#category-list"),
        productList: document.querySelector("#product-list"),
        search: document.querySelector("#product-search"),
        cartPanel: document.querySelector("#cart-panel"),
        cartItems: document.querySelector("#cart-items"),
        cartEmpty: document.querySelector("#cart-empty"),
        cartSummary: document.querySelector("#cart-summary"),
        cartItemCount: document.querySelector("#cart-item-count"),
        headerCartCount: document.querySelector("#header-cart-count"),
        subtotal: document.querySelector("#cart-subtotal"),
        delivery: document.querySelector("#cart-delivery"),
        total: document.querySelector("#cart-total"),
        deliveryHint: document.querySelector("#delivery-hint"),
        productModal: document.querySelector("#product-modal"),
        productModalImage: document.querySelector("#product-modal-image"),
        productModalTitle: document.querySelector("#product-modal-title"),
        productModalDescription: document.querySelector("#product-modal-description"),
        productModalPrice: document.querySelector("#product-modal-price"),
        productNote: document.querySelector("#product-note"),
        productQuantity: document.querySelector("#product-quantity"),
        productAddTotal: document.querySelector("#product-add-total"),
        modal: document.querySelector("#checkout-modal"),
        form: document.querySelector("#checkout-form"),
        formError: document.querySelector("#form-error"),
        addressFields: document.querySelector("#address-fields"),
        changeField: document.querySelector("#change-field"),
        toast: document.querySelector("#toast")
    };

    const state = {
        products: [], categories: [], config: {}, cart: new Map(), category: "Todos", search: "",
        selectedProductId: null, productQuantity: 1
    };
    let toastTimer;
    let pendingWhatsappWindow = null;

    const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);

    function showToast(message) {
        elements.toast.textContent = message;
        elements.toast.classList.add("visible");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2800);
    }

    function cartLineKey(id, notes) {
        return JSON.stringify([id, notes]);
    }

    function restoreCart() {
        try {
            const saved = JSON.parse(localStorage.getItem("pronto-cart") || "[]");
            if (!Array.isArray(saved)) return;
            saved.forEach((entry) => {
                if (!entry || typeof entry !== "object") return;
                const product = state.products.find((item) => item.id === Number(entry.id));
                const quantity = Number(entry.quantity);
                const notes = typeof entry.notes === "string" ? entry.notes.trim().slice(0, 300) : "";
                if (product && Number.isInteger(quantity) && quantity > 0 && quantity <= 20) {
                    const key = cartLineKey(product.id, notes);
                    const currentQuantity = state.cart.get(key)?.quantity || 0;
                    if (currentQuantity + quantity <= 20) {
                        state.cart.set(key, { id: product.id, quantity: currentQuantity + quantity, notes });
                    }
                }
            });
        } catch (error) {
            localStorage.removeItem("pronto-cart");
        }
    }

    function saveCart() {
        localStorage.setItem("pronto-cart", JSON.stringify(
            Array.from(state.cart.values())
        ));
    }

    function renderCategories() {
        const categories = ["Todos", ...state.categories];
        elements.categoryList.innerHTML = categories.map((category) => `
            <button class="category-chip${category === state.category ? " active" : ""}" type="button"
                data-category="${escapeHTML(category)}" aria-pressed="${category === state.category}">
                ${escapeHTML(category)}
            </button>`).join("");
    }

    function renderProducts() {
        const query = state.search.trim().toLocaleLowerCase("pt-BR");
        const products = state.products.filter((product) => {
            const matchesCategory = state.category === "Todos" || product.category === state.category;
            const matchesQuery = !query || `${product.name} ${product.description} ${product.category}`
                .toLocaleLowerCase("pt-BR").includes(query);
            return matchesCategory && matchesQuery;
        });

        if (!products.length) {
            elements.productList.innerHTML = '<div class="no-results">Não encontramos produtos com essa busca.</div>';
            return;
        }

        elements.productList.innerHTML = products.map((product) => `
            <article class="product-card" data-product-card="${product.id}">
                <div class="product-image-wrap">
                    <img class="product-image" src="${escapeHTML(product.image_url)}" alt="${escapeHTML(product.name)}" loading="lazy">
                    ${product.featured ? '<span class="product-badge">✦ Favorito da casa</span>' : ""}
                </div>
                <div class="product-info">
                    <div class="product-title-row">
                        <h3 class="product-title">${escapeHTML(product.name)}</h3>
                        <span class="product-price">${currency.format(Number(product.price))}</span>
                    </div>
                    <p class="product-description">${escapeHTML(product.description)}</p>
                    <button class="add-button" type="button" data-add="${product.id}" aria-label="Ver detalhes e personalizar ${escapeHTML(product.name)}">
                        <span aria-hidden="true">＋</span> Ver detalhes e adicionar
                    </button>
                </div>
            </article>`).join("");
    }

    function calculateTotals(fulfillment = "delivery") {
        let subtotalCents = 0;
        state.cart.forEach(({ id, quantity }) => {
            const product = state.products.find((entry) => entry.id === id);
            if (product) subtotalCents += Math.round(Number(product.price) * 100) * quantity;
        });

        const deliveryFeeCents = fulfillment === "delivery"
            && !(Number(state.config.free_delivery_minimum) > 0
                && subtotalCents >= Math.round(Number(state.config.free_delivery_minimum) * 100))
            ? Math.round(Number(state.config.delivery_fee || 0) * 100)
            : 0;

        return { subtotalCents, deliveryFeeCents, totalCents: subtotalCents + deliveryFeeCents };
    }

    function renderCart() {
        let quantityTotal = 0;
        const items = [];

        state.cart.forEach((line) => {
            const { id, quantity } = line;
            const product = state.products.find((entry) => entry.id === id);
            if (!product) return;
            quantityTotal += quantity;
            items.push({ product, quantity, notes: line.notes, key: cartLineKey(id, line.notes) });
        });

        const totals = calculateTotals();
        elements.headerCartCount.textContent = String(quantityTotal);
        elements.cartItemCount.textContent = quantityTotal ? `(${quantityTotal})` : "";
        elements.cartItems.innerHTML = items.map(({ product, quantity, notes, key }) => `
            <div class="cart-line">
                <div class="cart-line-main">
                    <p class="cart-line-title">${escapeHTML(product.name)}</p>
                    ${notes ? `<p class="cart-line-note">${escapeHTML(notes)}</p>` : ""}
                    <span class="cart-line-price">${currency.format(Number(product.price) * quantity)}</span>
                </div>
                <div class="cart-line-controls">
                    <button class="quantity-button" type="button" data-cart-line="${escapeHTML(key)}" data-delta="-1" aria-label="Remover uma unidade de ${escapeHTML(product.name)}">−</button>
                    <span class="quantity-value">${quantity}</span>
                    <button class="quantity-button" type="button" data-cart-line="${escapeHTML(key)}" data-delta="1" aria-label="Adicionar uma unidade de ${escapeHTML(product.name)}">+</button>
                </div>
            </div>`).join("");

        const isEmpty = quantityTotal === 0;
        elements.cartEmpty.hidden = !isEmpty;
        elements.cartSummary.hidden = isEmpty;
        elements.cartPanel.classList.toggle("is-empty", isEmpty);
        if (isEmpty && window.matchMedia("(max-width: 680px)").matches) {
            elements.cartPanel.classList.add("is-collapsed");
        }
        elements.subtotal.textContent = currency.format(totals.subtotalCents / 100);
        elements.delivery.textContent = currency.format(totals.deliveryFeeCents / 100);
        elements.total.textContent = currency.format(totals.totalCents / 100);
        const freeDeliveryMinimum = Number(state.config.free_delivery_minimum || 0);
        if (freeDeliveryMinimum > 0 && totals.subtotalCents < Math.round(freeDeliveryMinimum * 100)) {
            const remaining = freeDeliveryMinimum - totals.subtotalCents / 100;
            elements.deliveryHint.textContent = `Faltam ${currency.format(remaining)} para ganhar entrega grátis.`;
            elements.deliveryHint.style.display = "block";
        } else {
            elements.deliveryHint.style.display = "none";
        }
        if (!isEmpty && window.matchMedia("(max-width: 680px)").matches) {
            elements.cartPanel.classList.add("has-items");
        } else {
            elements.cartPanel.classList.remove("has-items");
        }
    }

    function changeQuantity(id, delta, notes = "") {
        const product = state.products.find((entry) => entry.id === id);
        if (!product) return;
        const normalizedNotes = notes.trim().slice(0, 300);
        const key = cartLineKey(id, normalizedNotes);
        const line = state.cart.get(key);
        const next = (line?.quantity || 0) + delta;
        const productQuantity = Array.from(state.cart.values())
            .filter((entry) => entry.id === id)
            .reduce((total, entry) => total + entry.quantity, 0);
        if (delta > 0 && productQuantity + delta > 20) {
            showToast("O limite é 20 unidades por produto.");
            return;
        }
        if (next <= 0) state.cart.delete(key);
        else state.cart.set(key, { id, quantity: next, notes: normalizedNotes });
        saveCart();
        renderCart();
        if (delta > 0) {
            showToast(`${product.name} adicionado à sacola.`);
            if (window.matchMedia("(max-width: 680px)").matches) {
                elements.cartPanel.classList.remove("is-collapsed");
            }
        }
    }

    function openProductModal(id) {
        const product = state.products.find((entry) => entry.id === id);
        if (!product) return;
        state.selectedProductId = id;
        state.productQuantity = 1;
        elements.productModalImage.src = product.image_url;
        elements.productModalImage.alt = product.name;
        elements.productModalTitle.textContent = product.name;
        elements.productModalDescription.textContent = product.description;
        elements.productModalDescription.hidden = !product.description;
        elements.productModalPrice.textContent = currency.format(Number(product.price));
        elements.productNote.value = "";
        updateProductModalTotal();
        elements.productModal.hidden = false;
        document.body.style.overflow = "hidden";
        elements.productNote.focus();
    }

    function closeProductModal() {
        elements.productModal.hidden = true;
        document.body.style.overflow = "";
        state.selectedProductId = null;
    }

    function updateProductModalTotal() {
        const product = state.products.find((entry) => entry.id === state.selectedProductId);
        elements.productQuantity.textContent = String(state.productQuantity);
        elements.productAddTotal.textContent = currency.format(
            product ? Number(product.price) * state.productQuantity : 0
        );
    }

    function addProductFromModal() {
        if (state.selectedProductId === null) return;
        changeQuantity(state.selectedProductId, state.productQuantity, elements.productNote.value);
        closeProductModal();
    }

    async function loadMenu() {
        try {
            const response = await fetch("api/menu.php", { headers: { Accept: "application/json" } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Não foi possível carregar o cardápio.");

            state.products = data.products;
            state.categories = data.categories;
            state.config = data.store;
            elements.form.querySelector('input[name="payment_method"][value="pix_online"]').disabled =
                !data.online_payments_enabled;
            elements.form.querySelector('input[name="payment_method"][value="credit_card_online"]').disabled =
                !data.credit_card_online_enabled;
            const onlinePaymentUnavailable = document.querySelector("#online-payment-unavailable");
            onlinePaymentUnavailable.hidden = data.online_payments_enabled && data.credit_card_online_enabled;
            if (!data.online_payments_enabled || !data.credit_card_online_enabled) {
                const unavailableMessages = {
                    configuration: "Configure as credenciais SyncPay e a URL HTTPS no servidor para habilitar pagamentos online.",
                    database: "O banco ainda precisa ser atualizado para aceitar pagamentos online.",
                    configuration_and_database: "Configure a SyncPay no servidor e atualize o banco para habilitar pagamentos online.",
                    temporarily_disabled: "Por enquanto, o pagamento online está disponível somente por Pix. Cartão online ficará para depois."
                };
                onlinePaymentUnavailable.textContent = !data.online_payments_enabled
                    ? data.online_payments_message
                        || unavailableMessages[data.online_payments_reason]
                        || "Pagamento online indisponível no momento."
                    : !data.credit_card_online_enabled
                        ? unavailableMessages[data.credit_card_online_reason]
                            || "Pagamento online indisponível no momento."
                    : unavailableMessages[data.online_payments_reason]
                        || "Pagamento online indisponível no momento.";
            }
            elements.brand.textContent = data.store.name;
            document.title = `${data.store.name} — Cardápio online`;
            elements.storeStatus.textContent = data.store.is_open ? "Aberto agora" : "Fechado no momento";
            document.querySelector(".status-dot").style.background = data.store.is_open ? "#52a767" : "#d39343";
            elements.deliveryTime.textContent = `${data.store.estimated_delivery_minutes}–${data.store.estimated_delivery_minutes + 15} min`;
            restoreCart();
            renderCategories();
            renderProducts();
            renderCart();
        } catch (error) {
            elements.form.querySelectorAll('input[name="payment_method"][value$="_online"]').forEach((option) => {
                option.disabled = true;
            });
            const onlinePaymentUnavailable = document.querySelector("#online-payment-unavailable");
            onlinePaymentUnavailable.hidden = false;
            onlinePaymentUnavailable.textContent = "Não foi possível verificar a configuração dos pagamentos online.";
            elements.productList.innerHTML = `<div class="no-results">${escapeHTML(error.message)} Verifique a configuração do banco de dados e atualize a página.</div>`;
            elements.storeStatus.textContent = "Cardápio indisponível";
        }
    }

    function openCheckout() {
        if (!state.cart.size) {
            showToast("Adicione pelo menos um produto à sua sacola.");
            return;
        }
        if (!state.config.is_open) {
            showToast("A loja está fechada no momento. Tente novamente mais tarde.");
            return;
        }
        updateCheckoutTotal();
        elements.formError.hidden = true;
        elements.modal.hidden = false;
        document.body.style.overflow = "hidden";
        elements.form.elements.customer_name.focus();
    }

    function closeCheckout() {
        elements.modal.hidden = true;
        document.body.style.overflow = "";
    }

    function updateConditionalFields() {
        const fulfillment = elements.form.elements.fulfillment.value;
        const isDelivery = fulfillment === "delivery";
        elements.addressFields.hidden = !isDelivery;
        elements.addressFields.querySelectorAll("input").forEach((input) => {
            input.required = isDelivery && input.name !== "complement";
        });
        const paymentMethod = elements.form.elements.payment_method.value;
        const isCash = paymentMethod === "cash";
        const onlinePayment = paymentMethod.endsWith("_online");
        const onlineCustomerFields = document.querySelector("#online-customer-fields");
        onlineCustomerFields.hidden = !onlinePayment;
        elements.form.elements.customer_email.required = onlinePayment;
        elements.form.elements.customer_cpf.required = onlinePayment;
        elements.changeField.hidden = !isCash;
        elements.form.elements.cash_change.required = false;
        elements.form.querySelector('.submit-button span:first-child').textContent = onlinePayment
            ? "Continuar para pagamento"
            : "Enviar pedido pelo WhatsApp";
        document.querySelector("#checkout-payment-note").innerHTML = onlinePayment
            ? '<span aria-hidden="true">✓</span> Você continuará para o checkout seguro.'
            : '<span aria-hidden="true">✓</span> Seu pedido será enviado à loja pelo WhatsApp.';
        updateCheckoutTotal();
    }

    function updateCheckoutTotal() {
        const fulfillment = elements.form.elements.fulfillment.value || "delivery";
        const totals = calculateTotals(fulfillment);
        document.querySelector("#checkout-total").textContent = currency.format(totals.totalCents / 100);
    }

    function formatPhone(value) {
        const digits = value.replace(/\D/g, "").slice(0, 13);
        if (digits.length <= 2) return digits;

        const hasCountryCode = digits.startsWith("55") && digits.length > 11;
        const areaCode = hasCountryCode ? digits.slice(2, 4) : digits.slice(0, 2);
        const number = hasCountryCode ? digits.slice(4) : digits.slice(2);
        const prefix = hasCountryCode ? `+55 (${areaCode}) ` : `(${areaCode}) `;
        const separatorAt = number.length > 8 ? 5 : 4;

        if (number.length <= separatorAt) return prefix + number;
        return `${prefix}${number.slice(0, separatorAt)}-${number.slice(separatorAt)}`;
    }

    function formatCpf(value) {
        const digits = value.replace(/\D/g, "").slice(0, 11);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }

    function applyInputMask(input, formatter) {
        const formatInput = () => {
            const selectionStart = input.selectionStart ?? input.value.length;
            const digitsBeforeCursor = input.value.slice(0, selectionStart).replace(/\D/g, "").length;
            input.value = formatter(input.value);

            let cursorPosition = 0;
            let digitsSeen = 0;
            while (cursorPosition < input.value.length && digitsSeen < digitsBeforeCursor) {
                if (/\d/.test(input.value[cursorPosition])) digitsSeen += 1;
                cursorPosition += 1;
            }
            if (document.activeElement === input) {
                input.setSelectionRange(cursorPosition, cursorPosition);
            }
        };

        input.addEventListener("input", formatInput);
        input.addEventListener("change", formatInput);
        input.addEventListener("blur", formatInput);
    }

    async function submitOrder(event) {
        event.preventDefault();
        elements.formError.hidden = true;
        const submitButton = elements.form.querySelector('[type="submit"]');
        submitButton.disabled = true;
        submitButton.querySelector("span:first-child").textContent = "Preparando seu pedido...";

        const formData = new FormData(elements.form);
        const paymentMethod = formData.get("payment_method");
        const onlinePayment = paymentMethod.endsWith("_online");
        pendingWhatsappWindow = onlinePayment ? null : window.open("about:blank", "_blank");
        const payload = {
            customer_name: formData.get("customer_name").trim(),
            customer_phone: formData.get("customer_phone").replace(/\D/g, ""),
            fulfillment: formData.get("fulfillment"),
            address: formData.get("address").trim(),
            complement: formData.get("complement").trim(),
            neighborhood: formData.get("neighborhood").trim(),
            payment_method: formData.get("payment_method"),
            cash_change: formData.get("cash_change").trim(),
            notes: formData.get("notes").trim(),
            items: Array.from(state.cart.values())
        };

        try {
            if (onlinePayment) {
                payload.customer_email = formData.get("customer_email").trim();
                payload.customer_cpf = formData.get("customer_cpf").replace(/\D/g, "");
            }
            const response = await fetch("api/orders.php", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Não foi possível registrar seu pedido.");

            const trackingUrl = new URL("acompanhar.php", window.location.href);
            trackingUrl.searchParams.set("token", result.tracking_token);
            let whatsappUrl = null;
            if (!onlinePayment) {
                whatsappUrl = new URL(result.whatsapp_url);
                const whatsappMessage = whatsappUrl.searchParams.get("text") || "";
                whatsappUrl.searchParams.set("text", `${whatsappMessage}\n\nAcompanhe o andamento do pedido: ${trackingUrl.href}`);
            }

            state.cart.clear();
            saveCart();
            renderCart();
            closeCheckout();
            if (pendingWhatsappWindow && !pendingWhatsappWindow.closed) {
                pendingWhatsappWindow.location.replace(whatsappUrl.href);
            }
            const confirmation = document.querySelector("#order-confirmation");
            const pixPaymentPanel = result.pix_code
                ? `<section class="pix-payment-panel">
                    <h3>Pix copia e cola</h3>
                    <p>Escaneie o QR Code com o aplicativo do seu banco ou use Pix Copia e Cola. O pagamento será confirmado automaticamente.</p>
                    <div class="pix-qr-code" id="pix-payment-qr" role="img" aria-label="QR Code Pix para pagamento"></div>
                    <textarea id="pix-payment-code" readonly aria-label="Código Pix">${escapeHTML(result.pix_code)}</textarea>
                    <button class="tracking-button" type="button" id="copy-pix-code">Copiar código Pix</button>
                </section>`
                : "";
            confirmation.innerHTML = `<h2>Pedido #${escapeHTML(result.order_number)} recebido!</h2>
                <p>${onlinePayment
                    ? result.pix_code
                        ? "Seu pedido está aguardando o pagamento Pix."
                        : "Os dados do cartão foram enviados à SyncPay. Aguarde a confirmação da operadora."
                    : "Depois que a loja atualizar o pedido, você poderá ver o andamento por este link:"}</p>
                ${pixPaymentPanel}
                ${onlinePayment ? "<p>Acompanhe o pagamento e o andamento do pedido:</p>" : ""}
                <a class="tracking-button" href="${escapeHTML(trackingUrl.href)}">Acompanhar meu pedido <span aria-hidden="true">→</span></a>
                <p class="tracking-privacy">Guarde este link. Qualquer pessoa que o possuir poderá consultar o andamento deste pedido.</p>`;
            if (result.pix_code) {
                const pixCodeField = confirmation.querySelector("#pix-payment-code");
                pixCodeField.value = result.pix_code;
                window.renderPixQr(confirmation.querySelector("#pix-payment-qr"), result.pix_code);
                confirmation.querySelector("#copy-pix-code").addEventListener("click", async () => {
                    try {
                        await navigator.clipboard.writeText(result.pix_code);
                        showToast("Código Pix copiado.");
                    } catch {
                        pixCodeField.focus();
                        pixCodeField.select();
                        showToast("Selecione e copie o código Pix.");
                    }
                });
            }
            confirmation.hidden = false;
            confirmation.scrollIntoView({ behavior: "smooth", block: "nearest" });
            showToast(onlinePayment
                ? `Pedido #${result.order_number} pronto! ${result.pix_code ? "Pague com Pix." : "Aguardando confirmação do cartão."}`
                : `Pedido #${result.order_number} pronto! Confirme pelo WhatsApp.`);
            elements.form.reset();
            updateConditionalFields();
        } catch (error) {
            if (pendingWhatsappWindow && !pendingWhatsappWindow.closed) pendingWhatsappWindow.close();
            elements.formError.textContent = error.message;
            elements.formError.hidden = false;
        } finally {
            pendingWhatsappWindow = null;
            submitButton.disabled = false;
            submitButton.querySelector("span:first-child").textContent =
                elements.form.elements.payment_method.value.endsWith("_online")
                    ? "Continuar para pagamento"
                    : "Enviar pedido pelo WhatsApp";
        }
    }

    elements.categoryList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");
        if (!button) return;
        state.category = button.dataset.category;
        renderCategories();
        renderProducts();
    });

    elements.productList.addEventListener("click", (event) => {
        const button = event.target.closest("[data-add]");
        if (button) {
            openProductModal(Number(button.dataset.add));
            return;
        }
        const card = event.target.closest("[data-product-card]");
        if (card) openProductModal(Number(card.dataset.productCard));
    });

    elements.cartItems.addEventListener("click", (event) => {
        const button = event.target.closest("[data-cart-line]");
        if (!button) return;
        const line = state.cart.get(button.dataset.cartLine);
        if (line) changeQuantity(line.id, Number(button.dataset.delta), line.notes);
    });

    elements.search.addEventListener("input", () => {
        state.search = elements.search.value;
        renderProducts();
    });

    document.querySelector("#checkout-button").addEventListener("click", openCheckout);
    document.querySelector("#product-modal-close").addEventListener("click", closeProductModal);
    elements.productModal.addEventListener("click", (event) => {
        if (event.target === elements.productModal) closeProductModal();
    });
    document.querySelector("#product-quantity-decrease").addEventListener("click", () => {
        if (state.productQuantity > 1) {
            state.productQuantity -= 1;
            updateProductModalTotal();
        }
    });
    document.querySelector("#product-quantity-increase").addEventListener("click", () => {
        if (state.productQuantity < 20) {
            state.productQuantity += 1;
            updateProductModalTotal();
        }
    });
    document.querySelector("#product-add-button").addEventListener("click", addProductFromModal);
    document.querySelector("#header-cart").addEventListener("click", () => {
        elements.cartPanel.classList.toggle("is-collapsed");
        elements.cartPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    document.querySelector("#cart-collapse").addEventListener("click", () => {
        elements.cartPanel.classList.toggle("is-collapsed");
    });
    document.querySelector("#modal-close").addEventListener("click", closeCheckout);
    elements.modal.addEventListener("click", (event) => {
        if (event.target === elements.modal) closeCheckout();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (!elements.productModal.hidden) closeProductModal();
        else if (!elements.modal.hidden) closeCheckout();
    });
    applyInputMask(elements.form.elements.customer_phone, formatPhone);
    applyInputMask(elements.form.elements.customer_cpf, formatCpf);
    elements.form.addEventListener("change", updateConditionalFields);
    elements.form.addEventListener("submit", submitOrder);
    loadMenu();
})();
