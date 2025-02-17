<script setup lang="ts">
const { $api } = useNuxtApp();

const isSignupMode = ref(false);
const firstName = ref();
const lastName = ref();
const email = ref();
const password = ref();
const passwordConfirmation = ref();

const signIn = async () => {
  return await $api.sendRequest("/signin", "POST", {
    email: email.value,
    password: password.value,
  });
};

const signUp = async () => {
  try {
    $api.sendRequest<User>("/user", "POST", {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value,
    });
  } catch (e) {
    console.error(e);
  } finally {
    signIn();
  }
};

const isButtonDisabled = computed(() => {
  if (!isSignupMode.value) {
    return !(email.value && isValidEmail(email.value) && password.value);
  } else {
    return !(
      firstName.value &&
      lastName.value &&
      email.value &&
      password.value &&
      isSamePassword(password.value, passwordConfirmation.value)
    );
  }
});
</script>
<template>
  <NuxtLayout>
    <div class="header" v-if="isSignupMode">
      <h2>Sign up</h2>
      <p>
        Already have an account?
        <span class="link" @click="isSignupMode = !isSignupMode">Sign in</span>
      </p>
    </div>
    <div v-else class="header">
      <h2>Sign in</h2>
      <p>
        Don't have an account yet?
        <span class="link" @click="isSignupMode = !isSignupMode">Sign up</span>
      </p>
    </div>

    <div class="input-field" v-if="isSignupMode">
      <p class="field-label">First name</p>
      <input type="text" v-model="firstName" />
    </div>

    <div class="input-field" v-if="isSignupMode">
      <p class="field-label">Last name</p>
      <input type="text" v-model="lastName" />
    </div>
    <div class="input-field">
      <p class="field-label">Email</p>
      <input
        type="email"
        :class="{ error: email && !isValidEmail(email) }"
        v-model="email"
      />
    </div>
    <div class="input-field">
      <p class="field-label">Password</p>
      <input type="password" v-model="password" />
    </div>
    <div class="input-field" v-if="isSignupMode">
      <p class="field-label">Confirm Password</p>
      <input
        type="password"
        :class="{
          error:
            passwordConfirmation &&
            !isSamePassword(password, passwordConfirmation),
        }"
        v-model="passwordConfirmation"
      />
    </div>
    <NuxtLink to="/" :class="{ disabled: isButtonDisabled }"
      ><div class="form-button flex" v-if="isSignupMode" @click="signUp">
        Sign up
      </div>
      <div class="form-button flex" v-else @click="signIn">
        Sign in
      </div></NuxtLink
    >
  </NuxtLayout>
</template>
