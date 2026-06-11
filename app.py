import sqlite3
import pandas as pd
import streamlit as st
from db import init_db, DB_PATH
from ollama_client import ask_ollama
from config import PROCESS_OPTIONS, ROAST_LEVEL_OPTIONS, ACIDITY_OPTIONS, SWEETNESS_OPTIONS, BODY_OPTIONS, BALANCE_OPTIONS, OVERALL_STYLE_OPTIONS, BREW_METHOD_OPTIONS, FLAVOR_NOTES

st.set_page_config(page_title="Coffee AI Assistant", page_icon="☕", layout="wide")
init_db()

def get_conn(): return sqlite3.connect(DB_PATH)
def read_df(query, params=None):
    conn = get_conn(); df = pd.read_sql_query(query, conn, params=params or []); conn.close(); return df
def execute(query, params=None):
    conn = get_conn(); cur = conn.cursor(); cur.execute(query, params or []); conn.commit(); conn.close()
def join_list(values): return ",".join(values) if values else ""
def safe_ratio(water_g, dose_g): return round(water_g / dose_g, 2) if dose_g and dose_g > 0 else None

st.title("☕ Coffee AI Assistant")
st.caption("Local coffee database + AI brewing assistant. Data values are normalized in English.")

tab1, tab2, tab3, tab4, tab5 = st.tabs(["Beans", "Brew Logs", "AI Recommendation", "Grinder Profiles", "Flavor Taxonomy"])

with tab1:
    st.subheader("Add Coffee Bean")
    st.caption("UI can be bilingual, but database values are normalized English labels.")
    with st.form("add_bean"):
        col1, col2, col3 = st.columns(3)
        with col1:
            name = st.text_input("Bean name *")
            roaster = st.text_input("Roaster")
            country = st.text_input("Country")
            region = st.text_input("Region")
        with col2:
            farm = st.text_input("Farm / Producer")
            altitude_m = st.text_input("Altitude m")
            variety = st.text_input("Variety")
            process = st.selectbox("Process", PROCESS_OPTIONS)
        with col3:
            roast_level = st.selectbox("Roast level", ROAST_LEVEL_OPTIONS)
            roast_date = st.date_input("Roast date", value=None)
            overall_style = st.selectbox("Overall style", OVERALL_STYLE_OPTIONS)
        flavor_notes = st.multiselect("Flavor notes", FLAVOR_NOTES)
        col4, col5, col6, col7 = st.columns(4)
        with col4: acidity = st.selectbox("Acidity", ACIDITY_OPTIONS)
        with col5: sweetness = st.selectbox("Sweetness", SWEETNESS_OPTIONS)
        with col6: body = st.selectbox("Body", BODY_OPTIONS)
        with col7: balance = st.selectbox("Balance", BALANCE_OPTIONS)
        original_description = st.text_area("Original description", placeholder="Example: ausgewogen, kräftig und würzig, aber mit dezenter Säure")
        notes = st.text_area("Notes")
        if st.form_submit_button("Save Bean"):
            if not name: st.error("Bean name is required.")
            else:
                execute("""INSERT INTO beans (name, roaster, country, region, farm, altitude_m, variety, process, roast_level, roast_date, flavor_notes, acidity, sweetness, body, balance, overall_style, original_description, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", [name, roaster, country, region, farm, altitude_m, variety, process, roast_level, str(roast_date) if roast_date else None, join_list(flavor_notes), acidity, sweetness, body, balance, overall_style, original_description, notes])
                st.success("Bean saved.")
    st.subheader("Bean List")
    st.dataframe(read_df("SELECT * FROM beans ORDER BY id DESC"), use_container_width=True)

with tab2:
    st.subheader("Add Brew Log")
    beans = read_df("SELECT id, name, roaster, country, process, roast_level FROM beans ORDER BY id DESC")
    if beans.empty:
        st.info("Please add at least one bean first.")
    else:
        bean_options = {f"{row['name']} | {row.get('roaster') or ''} | {row.get('country') or ''} | {row.get('process') or ''} | {row.get('roast_level') or ''}": row['id'] for _, row in beans.iterrows()}
        with st.form("add_brew"):
            col1, col2, col3 = st.columns(3)
            with col1:
                selected_bean = st.selectbox("Bean", list(bean_options.keys()))
                brew_date = st.date_input("Brew date")
                brew_method = st.selectbox("Brew method", BREW_METHOD_OPTIONS)
                grinder = st.text_input("Grinder", value="Generic")
            with col2:
                grind_setting = st.text_input("Grind setting", placeholder="Example: 24 clicks / 5.5 / medium")
                dose_g = st.number_input("Dose g", min_value=0.0, value=15.0, step=0.5)
                water_g = st.number_input("Water g", min_value=0.0, value=240.0, step=5.0)
                water_temp_c = st.number_input("Water temp °C", min_value=0.0, value=92.0, step=1.0)
            with col3:
                bloom_time_sec = st.number_input("Bloom time sec", min_value=0, value=45, step=5)
                total_brew_time_sec = st.number_input("Total brew time sec", min_value=0, value=150, step=5)
                score = st.slider("Score", 1.0, 10.0, 8.0, 0.1)
            col4, col5, col6, col7 = st.columns(4)
            with col4: perceived_acidity = st.selectbox("Perceived acidity", ACIDITY_OPTIONS)
            with col5: perceived_sweetness = st.selectbox("Perceived sweetness", SWEETNESS_OPTIONS)
            with col6: perceived_body = st.selectbox("Perceived body", BODY_OPTIONS)
            with col7: perceived_balance = st.selectbox("Perceived balance", BALANCE_OPTIONS)
            issue_tags = st.multiselect("Issue tags", ["too_sour", "too_bitter", "too_weak", "too_strong", "watery", "astringent", "hollow", "muddy", "slow_drawdown", "fast_drawdown", "excellent_aroma", "sweet_finish"])
            notes = st.text_area("Notes")
            if st.form_submit_button("Save Brew Log"):
                ratio = safe_ratio(water_g, dose_g)
                execute("""INSERT INTO brew_logs (bean_id, brew_date, brew_method, grinder, grind_setting, dose_g, water_g, ratio, water_temp_c, bloom_time_sec, total_brew_time_sec, perceived_acidity, perceived_sweetness, perceived_body, perceived_balance, score, issue_tags, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", [bean_options[selected_bean], str(brew_date), brew_method, grinder, grind_setting, dose_g, water_g, ratio, water_temp_c, bloom_time_sec, total_brew_time_sec, perceived_acidity, perceived_sweetness, perceived_body, perceived_balance, score, join_list(issue_tags), notes])
                st.success("Brew log saved.")
    st.subheader("Brew Log List")
    st.dataframe(read_df("""SELECT brew_logs.id, brew_logs.brew_date, beans.name AS bean_name, beans.roaster, beans.country, beans.process, beans.roast_level, brew_logs.brew_method, brew_logs.grinder, brew_logs.grind_setting, brew_logs.dose_g, brew_logs.water_g, brew_logs.ratio, brew_logs.water_temp_c, brew_logs.bloom_time_sec, brew_logs.total_brew_time_sec, brew_logs.perceived_acidity, brew_logs.perceived_sweetness, brew_logs.perceived_body, brew_logs.perceived_balance, brew_logs.score, brew_logs.issue_tags, brew_logs.notes FROM brew_logs LEFT JOIN beans ON brew_logs.bean_id = beans.id ORDER BY brew_logs.id DESC"""), use_container_width=True)

with tab3:
    st.subheader("AI Brewing Recommendation")
    st.caption("AI output is Chinese, but it reasons over normalized English data.")
    history_df = read_df("""SELECT beans.name AS bean_name, beans.roaster, beans.country, beans.region, beans.process, beans.roast_level, beans.flavor_notes, beans.acidity AS bean_acidity, beans.sweetness AS bean_sweetness, beans.body AS bean_body, beans.balance AS bean_balance, beans.overall_style, brew_logs.brew_method, brew_logs.grinder, brew_logs.grind_setting, brew_logs.dose_g, brew_logs.water_g, brew_logs.ratio, brew_logs.water_temp_c, brew_logs.bloom_time_sec, brew_logs.total_brew_time_sec, brew_logs.perceived_acidity, brew_logs.perceived_sweetness, brew_logs.perceived_body, brew_logs.perceived_balance, brew_logs.score, brew_logs.issue_tags, brew_logs.notes FROM brew_logs LEFT JOIN beans ON brew_logs.bean_id = beans.id ORDER BY brew_logs.score DESC, brew_logs.id DESC LIMIT 30""")
    st.write("High-score historical brews used as context:")
    st.dataframe(history_df, use_container_width=True)
    col1, col2 = st.columns(2)
    with col1:
        target_method = st.selectbox("Target brew method", BREW_METHOD_OPTIONS)
        target_goal = st.text_area("Goal / problem", value="I want a sweeter, more balanced cup with gentle acidity.")
    with col2:
        model = st.text_input("Ollama model", value="llama3.2:3b")
        extra_info = st.text_area("Extra info", placeholder="Example: new bean, medium_light roast, tastes too sour today...")
    if st.button("Generate Recommendation"):
        history_text = history_df.to_string(index=False)
        prompt = f'''You are a precise coffee brewing assistant.

The user's coffee database uses normalized English values. Please answer in Chinese, but keep specific database values in English when useful.

Here are the user's historical brew records, ordered by score:

{history_text}

Target brew method:
{target_method}

User goal or problem:
{target_goal}

Extra information:
{extra_info}

Please provide:
1. Recommended grind setting
2. Recommended ratio
3. Recommended water temperature
4. Recommended bloom time and total brew time
5. Why these parameters make sense based on the history
6. Adjustment rules for too_sour, too_bitter, watery, astringent

Rules: Be direct. Prioritize the user's own historical data. If data is insufficient, say so clearly and give a reasonable starting recipe. Do not give vague advice.'''
        with st.spinner("Calling local Ollama..."):
            st.markdown(ask_ollama(prompt, model=model))

with tab4:
    st.subheader("Grinder Profiles")
    st.dataframe(read_df("SELECT * FROM grinder_profiles ORDER BY grinder, brew_method"), use_container_width=True)
    st.subheader("Add Grinder Profile")
    with st.form("add_profile"):
        col1, col2, col3 = st.columns(3)
        with col1:
            grinder = st.text_input("Grinder")
            brew_method = st.selectbox("Brew method", BREW_METHOD_OPTIONS)
        with col2:
            grind_setting = st.text_input("Grind setting")
            particle_description = st.text_input("Particle description", placeholder="white_sugar_like")
        with col3:
            notes = st.text_area("Notes")
        if st.form_submit_button("Save Grinder Profile"):
            execute("INSERT INTO grinder_profiles (grinder, brew_method, grind_setting, particle_description, notes) VALUES (?, ?, ?, ?, ?)", [grinder, brew_method, grind_setting, particle_description, notes])
            st.success("Grinder profile saved.")

with tab5:
    st.subheader("Flavor Taxonomy")
    st.dataframe(read_df("SELECT * FROM flavor_taxonomy ORDER BY category, flavor_note"), use_container_width=True)
    st.markdown('''### Example mapping

German description:

`ausgewogen, kräftig und würzig, aber mit dezenter Säure`

Recommended normalized values:

- `overall_style = balanced`
- `body = heavy` or `round`
- `flavor_notes = spice`
- `acidity = low`
''')
