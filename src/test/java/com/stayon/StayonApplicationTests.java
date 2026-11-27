package com.stayon;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:stayon_testdb;DB_CLOSE_DELAY=-1"
})
class StayonApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void loginPageLoadsWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("STAYON")))
                .andExpect(content().string(containsString("Sign In")));
    }

    @Test
    void studentCanSignupSubmitTrackIssueAndWardenCanLoginWithCredentials() throws Exception {
        MockHttpSession studentSession = new MockHttpSession();

        mockMvc.perform(post("/signup")
                        .session(studentSession)
                        .param("fullName", "Aarav Patel")
                        .param("rollNumber", "CS21B042")
                        .param("roomNumber", "B-204")
                        .param("password", "pass1234"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/?section=dashboard"));

        mockMvc.perform(post("/issues")
                        .session(studentSession)
                        .param("studentName", "Aarav Patel")
                        .param("rollNumber", "CS21B042")
                        .param("category", "Wi-Fi")
                        .param("roomNumber", "B-204")
                        .param("description", "Router on 2nd floor not assigning IP"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/?section=report"));

        mockMvc.perform(get("/")
                        .session(studentSession)
                        .param("section", "track")
                        .param("rollNumber", "CS21B042"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("STY-0001")))
                .andExpect(content().string(containsString("Pending")));

        MockHttpSession wardenSession = new MockHttpSession();
        mockMvc.perform(post("/login")
                        .session(wardenSession)
                        .param("rollNumber", "32410321000")
                        .param("password", "warden@2566"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/?section=dashboard"));

        mockMvc.perform(get("/")
                        .session(wardenSession)
                        .param("section", "dashboard"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Warden Dashboard")));

        mockMvc.perform(post("/warden/notices")
                        .session(wardenSession)
                        .param("title", "Water Tank Maintenance")
                        .param("description", "Supply paused tomorrow 10 AM to 12 PM."))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/?section=manage-notices"));

        mockMvc.perform(get("/")
                        .session(studentSession)
                        .param("section", "notices"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Water Tank Maintenance")));
    }
}
