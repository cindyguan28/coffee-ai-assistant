import pandas as pd
import streamlit as st

from database.db import init_db, execute, fetch_all, fetch_one
from ai.bean_profile_engine import generate_bean_profile
from ai.ollama_client import ask_ollama
from database.import_knowledge import (
    get_country_options,
    get_process_options,
    get_roast_level_options,
    get_flavor_note_options,
    get_roaster_options,
)


st.set_page_config(
    page_title="Coffee AI Assistant",
    page_icon="☕",
    layout="wide",
)

init_db()

st.title("☕ Coffee AI Assistant V2")
st.caption("Personal coffee database + bean profile generation + brew log + local AI assistant")

tab_beans, tab_profiles, tab_brew, tab_best, tab_ai = st.tabs(
    ["Beans", "Bean Profiles", "Brew Logs", "Best Settings", "AI Assistant"]
)


with tab_beans:
    st.subheader("Add Coffee Bean")

    with st.form("add_bean"):
        country_options = get_country_options()
        process_options = get_process_options()
        roast_level_options = get_roast_level_options()
        flavor_note_options = get_flavor_note_options()
        roaster_options = [""] + get_roaster_options()

        previous_roaster_rows = fetch_all(
            "SELECT roaster, COUNT(*) AS cnt FROM beans WHERE roaster IS NOT NULL AND roaster != '' GROUP BY roaster ORDER BY cnt DESC"
        )
        previous_roasters = [row["roaster"] for row in previous_roaster_rows if row.get("roaster")]
        roaster_options += [r for r in previous_roasters if r and r not in roaster_options]

        acidity_options = ["", "very_low", "low", "medium", "high", "very_high"]
        body_options = ["", "light", "medium", "heavy", "full_bodied", "round", "creamy"]
        sweetness_options = ["", "low", "medium", "high", "very_high"]

        milk_compatibility_options = [
            "",
            "excellent_with_milk",
            "good_with_milk",
            "okay_with_milk",
            "espresso_only",
            "unknown",
        ]

        personal_interest_options = [
            "flavor_notes",
            "recommended_by_friend",
            "online_review",
            "roaster_recommendation",
            "origin_curiosity",
            "milk_drink_testing",
            "espresso_testing",
            "discount_or_offer",
            "beautiful_packaging",
            "experiment",
        ]

        col1, col2, col3 = st.columns(3)

        with col1:
            name = st.text_input("Bean name *")
            roaster_input = st.text_input(
                "Roaster",
                placeholder="Type roaster name here",
                help="Type to search known roasters or enter a new one.",
            ).strip()

            suggestion_options = [
                r for r in roaster_options
                if r and (not roaster_input or roaster_input.lower() in r.lower())
            ]
            selected_suggestion = ""
            if suggestion_options:
                selected_suggestion = st.selectbox(
                    "Choose a suggested roaster",
                    [""] + suggestion_options,
                    format_func=lambda r: r or "Select a suggestion",
                    key="roaster_suggestion",
                )

            roaster = selected_suggestion.strip() if selected_suggestion else roaster_input

            countries = st.multiselect(
                "Country",
                country_options,
                help="Select one or more origin countries for this bean.",
            )
            country = ",".join(countries)

        with col2:
            process = st.selectbox("Process", process_options)
            roast_level = st.selectbox("Roast level", roast_level_options)
            milk_compatibility = st.selectbox(
                "Milk compatibility",
                milk_compatibility_options,
            )

        with col3:
            acidity = st.selectbox("Acidity", acidity_options)
            body = st.selectbox("Body", body_options)
            sweetness = st.selectbox("Sweetness", sweetness_options)
            price = st.number_input(
                "Price",
                min_value=0.0,
                step=0.01,
                format="%.2f",
                help="Price per bag or package in your currency.",
            )
            weblink = st.text_input("Weblink", placeholder="https://")

        selected_flavor_notes = st.multiselect(
            "Flavor notes",
            flavor_note_options,
            format_func=lambda option: option[1],
            help="Choose flavor notes from the knowledge base.",
        )
        selected_flavor_notes = [option[0] for option in selected_flavor_notes]

        selected_personal_interest = st.multiselect(
            "Personal interest",
            personal_interest_options,
            help="Why did you buy or want to test this bean?",
        )

        description_raw = st.text_area(
            "Raw description",
            placeholder="Original description from package or website, e.g. ausgewogen, kräftig und würzig, aber mit dezenter Säure",
        )

        notes = st.text_area(
            "Personal notes",
            placeholder="Your own notes, e.g. looks suitable for latte, bought for testing, friend recommended...",
        )

        submitted = st.form_submit_button("Save Bean")

    if submitted:
        if not name:
            st.error("Bean name is required.")
        else:
            execute(
                """
                INSERT INTO beans
                (
                    name,
                    roaster,
                    country,
                    process,
                    roast_level,
                    price,
                    weblink,
                    flavor_notes,
                    acidity,
                    body,
                    sweetness,
                    milk_compatibility,
                    personal_interest,
                    description_raw,
                    notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    name,
                    roaster,
                    country,
                    process,
                    roast_level,
                    price,
                    weblink,
                    ",".join(selected_flavor_notes),
                    acidity,
                    body,
                    sweetness,
                    milk_compatibility,
                    ",".join(selected_personal_interest),
                    description_raw,
                    notes,
                ],
            )
            st.success("Bean saved.")

    st.subheader("Bean List")

    beans = fetch_all("SELECT * FROM beans ORDER BY id DESC")
    st.dataframe(pd.DataFrame(beans), use_container_width=True)

    if beans:
        st.subheader("Generate Bean Profile")

        bean_options = {
            f"{bean['id']} | {bean['name']} | {bean.get('country') or ''}": bean["id"]
            for bean in beans
        }

        selected_label = st.selectbox("Select bean", list(bean_options.keys()))
        selected_id = bean_options[selected_label]

        if st.button("Generate Bean Profile"):
            bean = fetch_one("SELECT * FROM beans WHERE id = ?", [selected_id])
            profile = generate_bean_profile(bean)

            execute(
                """
                INSERT INTO bean_profiles
                (
                    bean_id,
                    predicted_acidity,
                    predicted_body,
                    predicted_sweetness,
                    predicted_notes,
                    recommended_method,
                    recommended_ratio,
                    recommended_temp,
                    confidence,
                    reasoning
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(bean_id) DO UPDATE SET
                    predicted_acidity = excluded.predicted_acidity,
                    predicted_body = excluded.predicted_body,
                    predicted_sweetness = excluded.predicted_sweetness,
                    predicted_notes = excluded.predicted_notes,
                    recommended_method = excluded.recommended_method,
                    recommended_ratio = excluded.recommended_ratio,
                    recommended_temp = excluded.recommended_temp,
                    confidence = excluded.confidence,
                    reasoning = excluded.reasoning,
                    generated_at = CURRENT_TIMESTAMP
                """,
                [
                    selected_id,
                    profile["predicted_acidity"],
                    profile["predicted_body"],
                    profile["predicted_sweetness"],
                    profile["predicted_notes"],
                    profile["recommended_method"],
                    profile["recommended_ratio"],
                    profile["recommended_temp"],
                    profile["confidence"],
                    profile["reasoning"],
                ],
            )

            st.success("Bean Profile generated.")
            st.json(profile)


with tab_profiles:
    st.subheader("Bean Profiles")

    profiles = fetch_all(
        """
        SELECT
            beans.name AS bean_name,
            beans.roaster,
            beans.country,
            beans.process,
            beans.roast_level,
            bean_profiles.predicted_acidity,
            bean_profiles.predicted_body,
            bean_profiles.predicted_sweetness,
            bean_profiles.predicted_notes,
            bean_profiles.recommended_method,
            bean_profiles.recommended_ratio,
            bean_profiles.recommended_temp,
            bean_profiles.confidence,
            bean_profiles.reasoning,
            bean_profiles.generated_at
        FROM bean_profiles
        LEFT JOIN beans ON bean_profiles.bean_id = beans.id
        ORDER BY bean_profiles.generated_at DESC
        """
    )

    st.dataframe(pd.DataFrame(profiles), use_container_width=True)


with tab_brew:
    st.subheader("Add Brew Log")
    st.caption("This log is optimized for a home barista machine. Most technical values are optional.")

    beans = fetch_all("SELECT id, name FROM beans ORDER BY id DESC")

    if not beans:
        st.info("Please add a bean first.")
    else:
        bean_options = {f"{bean['id']} | {bean['name']}": bean["id"] for bean in beans}

        brew_method_options = [
            "espresso_machine",
            "automatic_machine",
            "moka_pot",
            "french_press",
            "v60",
            "other",
        ]

        brew_method_help = {
            "espresso_machine": "Semi-automatic or barista-style machine. Usually uses fine grind and pressure extraction.",
            "automatic_machine": "Fully automatic machine with built-in grinder and automatic extraction.",
            "moka_pot": "Stovetop moka pot. Uses medium-fine grind.",
            "french_press": "Immersion brew. Uses coarse grind.",
            "v60": "Pour-over method. Uses medium grind.",
            "other": "Use this if the method does not fit the above categories.",
        }

        drink_type_options = [
            "espresso",
            "lungo",
            "americano",
            "cappuccino",
            "latte",
            "flat_white",
            "milk_coffee",
            "other",
        ]

        grinder_type_options = [
            "",
            "built_in_grinder",
            "external_electric_grinder",
            "manual_grinder",
            "pre_ground",
            "unknown",
        ]

        milk_type_options = [
            "",
            "whole_milk",
            "low_fat_milk",
            "lactose_free_milk",
            "oat_milk",
            "soy_milk",
            "almond_milk",
            "other",
        ]

        taste_result_options = [
            "",
            "excellent",
            "good",
            "okay",
            "too_sour",
            "too_bitter",
            "too_weak",
            "too_strong",
            "watery",
            "astringent",
            "flat",
            "good_with_milk",
            "bad_with_milk",
        ]

        problem_tag_options = [
            "too_sour",
            "too_bitter",
            "too_weak",
            "too_strong",
            "watery",
            "astringent",
            "flat",
            "not_enough_body",
            "milk_too_much",
            "milk_too_little",
            "good_with_milk",
            "good_balance",
        ]

        next_adjustment_options = [
            "",
            "grind_finer",
            "grind_coarser",
            "increase_dose",
            "decrease_dose",
            "increase_milk",
            "decrease_milk",
            "try_as_espresso",
            "try_with_milk",
            "keep_setting",
        ]

        with st.form("add_brew_log"):
            st.markdown("### Basic Info")

            col1, col2, col3 = st.columns(3)

            with col1:
                selected_bean = st.selectbox("Bean", list(bean_options.keys()))
                brew_date = st.date_input(
                    "Brew date",
                    help="The date you made this cup."
                )
                bean_best_before = st.text_input(
                    "Bean best before / roast info",
                    value="",
                    placeholder="Example: best before 2026-12 / roasted on 2026-06-01 / unknown",
                    help="Use this if the package only shows a best-before date instead of roast date."
                )

            with col2:
                brew_method = st.selectbox(
                    "Brew method",
                    brew_method_options,
                    index=brew_method_options.index("espresso_machine"),
                    help="Choose the closest brewing setup."
                )
                st.caption(brew_method_help.get(brew_method, ""))

                drink_type = st.selectbox(
                    "Drink type",
                    drink_type_options,
                    index=drink_type_options.index("cappuccino"),
                    help="What did you actually drink?"
                )

            with col3:
                machine_model = st.text_input(
                    "Machine model",
                    value="Sage Barista Impress",
                    placeholder="Example: Sage Barista Express / DeLonghi La Specialista",
                    help="Useful because grind settings are machine-specific."
                )
                grinder_type = st.selectbox(
                    "Grinder type",
                    grinder_type_options,
                    index=grinder_type_options.index("built_in_grinder"),
                    help="Built-in grinder means the grind setting is usually machine-specific."
                )

            st.markdown("### Machine Setting")

            col4, col5, col6 = st.columns(3)

            with col4:
                grind_setting = st.slider(
                    "Grind setting",
                    min_value=1,
                    max_value=26,
                    value=10,
                    help="Use the number shown on your machine or grinder. For example, 1 = finer, 20 = coarser if your machine works that way."
                )

            with col5:
                default_dose_g = st.number_input(
                    "Default dose g",
                    min_value=0.0,
                    value=9.0,
                    step=0.5,
                    help="Optional. Many machines dose automatically, so leave 0 if unknown."
                )

            with col6:
                espresso_volume_ml = st.number_input(
                    "Espresso output ml",
                    min_value=0.0,
                    value=20.0,
                    step=2.0,
                    help="Optional. Leave 0 if your machine does not show or you do not measure it."
                )

            col7, col8, col9 = st.columns(3)

            with col7:
                extraction_time_sec = st.number_input(
                    "Extraction time sec",
                    min_value=0.0,
                    value=25.0,
                    step=1.0,
                    help="Optional. Time from starting extraction to coffee flow stopping. Leave 0 if unknown."
                )

            with col8:
                milk_ml = st.number_input(
                    "Milk amount ml",
                    min_value=0.0,
                    value=80.0,
                    step=10.0,
                    help="Optional. Useful for latte/cappuccino taste comparison."
                )

            with col9:
                milk_type = st.selectbox(
                    "Milk type",
                    milk_type_options,
                    index=milk_type_options.index("whole_milk"),
                    help="Milk type can strongly affect sweetness and body."
                )

            st.markdown("### Taste Evaluation")

            col10, col11, col12, col13, col14 = st.columns(5)

            with col10:
                acidity = st.slider("Acidity", 1, 5, 3)
            with col11:
                bitterness = st.slider("Bitterness", 1, 5, 3)
            with col12:
                body = st.slider("Body", 1, 5, 3)
            with col13:
                sweetness = st.slider("Sweetness", 1, 5, 3)
            with col14:
                balance = st.slider("Balance", 1, 5, 3)

            score = st.slider(
                "Overall score",
                1.0,
                10.0,
                8.0,
                0.1,
                help="Your personal overall score for this cup."
            )

            taste_result = st.selectbox(
                "Taste result",
                taste_result_options,
                help="A quick summary of how this cup tasted."
            )

            problem_tags = st.multiselect(
                "Problem tags",
                problem_tag_options,
                help="Choose all that apply. This helps future AI learn how grind setting affects taste."
            )

            next_adjustment = st.selectbox(
                "Next adjustment",
                next_adjustment_options,
                help="What should you try next time?"
            )

            notes = st.text_area(
                "Notes",
                placeholder="Example: grind 8 tasted too sour; grind 7 was better with 120ml milk."
            )

            submitted = st.form_submit_button("Save Brew Log")

            if submitted:
                execute(
                    """
                    INSERT INTO brew_logs
                    (
                        bean_id,
                        brew_date,
                        bean_best_before,
                        machine_model,
                        grinder_type,
                        default_dose_g,
                        brew_method,
                        drink_type,
                        grind_setting,
                        espresso_volume_ml,
                        extraction_time_sec,
                        milk_ml,
                        milk_type,
                        acidity,
                        bitterness,
                        body,
                        sweetness,
                        balance,
                        score,
                        taste_result,
                        problem_tags,
                        next_adjustment,
                        notes
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    [
                        bean_options[selected_bean],
                        str(brew_date),
                        bean_best_before,
                        machine_model,
                        grinder_type,
                        default_dose_g if default_dose_g != 0 else None,
                        brew_method,
                        drink_type,
                        grind_setting,
                        espresso_volume_ml if espresso_volume_ml != 0 else None,
                        extraction_time_sec if extraction_time_sec != 0 else None,
                        milk_ml if milk_ml != 0 else None,
                        milk_type,
                        acidity,
                        bitterness,
                        body,
                        sweetness,
                        balance,
                        score,
                        taste_result,
                        ",".join(problem_tags),
                        next_adjustment,
                        notes,
                    ],
                )
                st.success("Brew log saved.")

    st.subheader("Brew Logs")

    brew_logs = fetch_all(
        """
        SELECT
            brew_logs.id,
            brew_logs.brew_date,
            beans.name AS bean_name,
            brew_logs.bean_best_before,
            brew_logs.machine_model,
            brew_logs.grinder_type,
            brew_logs.brew_method,
            brew_logs.drink_type,
            brew_logs.grind_setting,
            brew_logs.default_dose_g,
            brew_logs.espresso_volume_ml,
            brew_logs.extraction_time_sec,
            brew_logs.milk_ml,
            brew_logs.milk_type,
            brew_logs.acidity,
            brew_logs.bitterness,
            brew_logs.body,
            brew_logs.sweetness,
            brew_logs.balance,
            brew_logs.score,
            brew_logs.taste_result,
            brew_logs.problem_tags,
            brew_logs.next_adjustment,
            brew_logs.notes
        FROM brew_logs
        LEFT JOIN beans ON brew_logs.bean_id = beans.id
        ORDER BY brew_logs.id DESC
        """
    )

    st.dataframe(pd.DataFrame(brew_logs), use_container_width=True)


with tab_ai:
    st.subheader("AI Brewing Assistant")
    st.caption("Uses your brew logs to suggest the next grind adjustment.")

    model = st.text_input("Ollama model", value="qwen2.5:7b")

    brew_logs = fetch_all(
        """
        SELECT
            brew_logs.brew_date,
            beans.name AS bean_name,
            beans.roaster,
            beans.country,
            beans.roast_level,
            beans.flavor_notes,
            brew_logs.machine_model,
            brew_logs.grinder_type,
            brew_logs.brew_method,
            brew_logs.drink_type,
            brew_logs.grind_setting,
            brew_logs.default_dose_g,
            brew_logs.espresso_volume_ml,
            brew_logs.extraction_time_sec,
            brew_logs.milk_ml,
            brew_logs.milk_type,
            brew_logs.acidity,
            brew_logs.bitterness,
            brew_logs.body,
            brew_logs.sweetness,
            brew_logs.balance,
            brew_logs.score,
            brew_logs.taste_result,
            brew_logs.problem_tags,
            brew_logs.next_adjustment,
            brew_logs.notes
        FROM brew_logs
        LEFT JOIN beans ON brew_logs.bean_id = beans.id
        ORDER BY brew_logs.id DESC
        LIMIT 30
        """
    )

    if not brew_logs:
        st.info("Add some brew logs first. AI needs your own taste data.")
    else:
        st.dataframe(pd.DataFrame(brew_logs), use_container_width=True)

        user_question = st.text_area(
            "Question",
            value="Based on my brew logs, what grind setting should I try next and how should I adjust if the coffee is too sour, too bitter, or too weak after adding milk?",
)

        if st.button("Ask AI"):
            history_text = pd.DataFrame(brew_logs).to_string(index=False)

            prompt = f"""
You are a coffee assistant.

STRICT RULES:
- Answer ONLY in English.
- Never use Chinese.
- Never use Traditional Chinese.
- Never mix multiple languages.
- Use concise and practical recommendations.
- Focus primarily on grind setting.
- Consider milk amount when the drink type contains milk.
- Ignore water temperature unless explicitly provided.
- Ignore extraction time if it is missing or zero.
- Do not invent machine parameters that are not in the data.

User brew logs:

{history_text}

User question:

{user_question}

Respond using this exact structure:

## Recommendation

One sentence summary of the best grind setting to try.

## Reasoning

Explain the recommendation based on the available brew logs.

## Next Test

- Grind setting:
- Milk amount:
- Drink type:
- What to observe:

## Adjustment Guide

- If too sour:
- If too bitter:
- If too weak:
- If milk hides the coffee flavor:

Keep the answer practical and based only on the available data.
"""

            with st.spinner("Calling local Ollama..."):
                answer = ask_ollama(prompt, model=model)

            st.markdown(answer)