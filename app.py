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
)


st.set_page_config(
    page_title="Coffee AI Assistant",
    page_icon="☕",
    layout="wide",
)

init_db()

st.title("☕ Coffee AI Assistant V2")
st.caption("Personal coffee database + bean profile generation + local AI assistant")

tab_beans, tab_profiles, tab_brew, tab_ai = st.tabs(
    ["Beans", "Bean Profiles", "Brew Logs", "AI Assistant"]
)


with tab_beans:
    st.subheader("Add Coffee Bean")

    with st.form("add_bean"):
        country_options = get_country_options()
        process_options = get_process_options()
        roast_level_options = get_roast_level_options()
        flavor_note_options = get_flavor_note_options()

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
            roaster = st.text_input("Roaster")
            country = st.selectbox("Country", country_options)

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

        selected_flavor_notes = st.multiselect(
            "Flavor notes",
            flavor_note_options,
            help="Choose flavor notes from the knowledge base.",
        )

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
                    flavor_notes,
                    acidity,
                    body,
                    sweetness,
                    milk_compatibility,
                    personal_interest,
                    description_raw,
                    notes
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    name,
                    roaster,
                    country,
                    process,
                    roast_level,
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

    beans = fetch_all("SELECT id, name FROM beans ORDER BY id DESC")

    if not beans:
        st.info("Please add a bean first.")
    else:
        bean_options = {f"{bean['id']} | {bean['name']}": bean["id"] for bean in beans}

        with st.form("add_brew_log"):
            col1, col2, col3 = st.columns(3)

            with col1:
                selected_bean = st.selectbox("Bean", list(bean_options.keys()))
                brew_date = st.date_input("Brew date")
                brew_method = st.text_input("Brew method", value="V60")

            with col2:
                grinder = st.text_input("Grinder")
                grind_setting = st.text_input("Grind setting")
                brew_time = st.text_input("Brew time", placeholder="Example: 2:30")

            with col3:
                dose_g = st.number_input("Dose g", min_value=0.0, value=15.0, step=0.5)
                water_g = st.number_input("Water g", min_value=0.0, value=240.0, step=5.0)
                water_temp_c = st.number_input("Water temp °C", min_value=0.0, value=92.0, step=1.0)

            score = st.slider("Score", 1.0, 10.0, 8.0, 0.1)
            notes = st.text_area("Tasting notes")

            submitted = st.form_submit_button("Save Brew Log")

            if submitted:
                execute(
                    """
                    INSERT INTO brew_logs
                    (
                        bean_id, brew_date, brew_method, grinder, grind_setting,
                        dose_g, water_g, water_temp_c, brew_time, score, notes
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    [
                        bean_options[selected_bean],
                        str(brew_date),
                        brew_method,
                        grinder,
                        grind_setting,
                        dose_g,
                        water_g,
                        water_temp_c,
                        brew_time,
                        score,
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
            brew_logs.brew_method,
            brew_logs.grinder,
            brew_logs.grind_setting,
            brew_logs.dose_g,
            brew_logs.water_g,
            brew_logs.water_temp_c,
            brew_logs.brew_time,
            brew_logs.score,
            brew_logs.notes
        FROM brew_logs
        LEFT JOIN beans ON brew_logs.bean_id = beans.id
        ORDER BY brew_logs.id DESC
        """
    )

    st.dataframe(pd.DataFrame(brew_logs), use_container_width=True)


with tab_ai:
    st.subheader("Ask Local AI")

    question = st.text_area(
        "Question",
        placeholder="Example: How should I brew this India medium roast coffee with low acidity?"
    )

    model = st.text_input("Ollama model", value="llama3.2:3b")

    if st.button("Ask Ollama"):
        if not question:
            st.warning("Please enter a question.")
        else:
            with st.spinner("Calling Ollama..."):
                answer = ask_ollama(question, model=model)
            st.markdown(answer)